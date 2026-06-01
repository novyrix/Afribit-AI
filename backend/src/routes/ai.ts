import { Router } from 'express';
import { z } from 'zod';
import { requireSession } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { runAgent } from '../ai/agent';
import { query } from '../db/client';
import type { Message } from '../ai/openrouter';
import type { Language } from '../ai/prompts';

const router = Router();

const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  language: z.enum(['en', 'sw', 'shg']).optional(),
});

/** POST /ai/chat — main conversational endpoint */
router.post('/chat', requireSession, aiLimiter, async (req, res) => {
  try {
    const { message, language } = ChatSchema.parse(req.body);

    // Get session language if not provided in request
    const session = await query<{ language: string }>(
      `SELECT language FROM sessions WHERE id = $1`,
      [req.sessionId]
    );
    const lang = (language ?? session[0]?.language ?? 'sw') as Language;

    // Load connected wallets + their balances
    const wallets = await query<{
      id: string; nickname: string; wallet_type: string;
    }>(
      `SELECT id, nickname, wallet_type
       FROM wallet_connections
       WHERE session_id = $1 AND is_active = TRUE`,
      [req.sessionId]
    );

    // Compute balance from cached transactions
    const walletSummaries = await Promise.all(
      wallets.map(async (w) => {
        const row = await query<{ balance_sats: string }>(
          `SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount_sats ELSE -amount_sats END), 0) as balance_sats
           FROM transactions_cache WHERE wallet_conn_id = $1`,
          [w.id]
        );
        return {
          walletConnId: w.id,
          nickname: w.nickname,
          walletType: w.wallet_type,
          balanceSats: parseInt(row[0]?.balance_sats ?? '0', 10),
        };
      })
    );

    // Load recent conversation history (last 20 turns)
    const historyRows = await query<{ role: string; content: string }>(
      `SELECT role, content FROM conversations
       WHERE session_id = $1 AND role IN ('user', 'assistant')
       ORDER BY created_at DESC LIMIT 40`,
      [req.sessionId]
    );
    const history = historyRows.reverse() as Message[];

    // Run the agent
    const result = await runAgent({
      sessionId: req.sessionId,
      userMessage: message,
      language: lang,
      wallets: walletSummaries,
      conversationHistory: history,
    });

    // Persist conversation turns
    await query(
      `INSERT INTO conversations (session_id, role, content) VALUES ($1, 'user', $2)`,
      [req.sessionId, message]
    );
    await query(
      `INSERT INTO conversations (session_id, role, content, model_used, tokens_in, tokens_out, latency_ms)
       VALUES ($1, 'assistant', $2, $3, $4, $5, $6)`,
      [req.sessionId, result.reply, result.modelUsed, result.tokensIn, result.tokensOut, result.latencyMs]
    );

    res.json({
      reply: result.reply,
      model: result.modelUsed,
      tier: result.routingTier,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      console.error('[ai/chat]', err);
      res.status(500).json({ error: 'AI request failed. Please try again.' });
    }
  }
});

/** GET /ai/history — recent conversation history */
router.get('/history', requireSession, async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? 40), 10), 100);
    const rows = await query<{
      id: string; role: string; content: string; model_used: string | null; created_at: Date;
    }>(
      `SELECT id, role, content, model_used, created_at
       FROM conversations
       WHERE session_id = $1 AND role IN ('user', 'assistant')
       ORDER BY created_at DESC LIMIT $2`,
      [req.sessionId, limit]
    );
    res.json(rows.reverse());
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/** DELETE /ai/history — clear conversation history */
router.delete('/history', requireSession, async (req, res) => {
  try {
    await query(
      `DELETE FROM conversations WHERE session_id = $1`,
      [req.sessionId]
    );
    res.json({ cleared: true });
  } catch {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

export default router;
