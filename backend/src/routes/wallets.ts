import { Router } from 'express';
import { z } from 'zod';
import { requireSession } from '../middleware/auth';
import { query, queryOne, withTransaction } from '../db/client';
import { randomUUID } from 'crypto';
import { BlinkConnector, BlinkError } from '../connectors/blink';
import { getCurrentRate } from '../connectors/coingecko';

const router = Router();

const ConnectBlinkSchema = z.object({
  apiKey: z
    .string()
    .min(10)
    .refine((k) => BlinkConnector.validateKeyFormat(k), {
      message: 'Invalid Blink API key format. Keys must start with "blink_".',
    }),
  nickname: z.string().max(100).default('Blink Wallet'),
});

const ConnectByokSchema = z.object({
  endpoint: z.string().url(),
  apiKey: z.string().min(4),
  nickname: z.string().max(100).default('My Wallet'),
});

/** POST /wallets/blink — connect a Blink wallet */
router.post('/blink', requireSession, async (req, res) => {
  try {
    const { apiKey, nickname } = ConnectBlinkSchema.parse(req.body);
    const connector = new BlinkConnector(apiKey);

    // Validate key against Blink API and fetch initial data
    let wallets;
    try {
      wallets = await connector.fetchWalletData(20);
    } catch (err) {
      if (err instanceof BlinkError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }

    if (!wallets.length) {
      res.status(400).json({ error: 'No BTC wallets found on this Blink account.' });
      return;
    }

    const blinkWallet = wallets[0];
    const rate = await getCurrentRate();

    const connId = await withTransaction(async (client) => {
      const id = randomUUID();
      await client.query(
        `INSERT INTO wallet_connections
           (id, session_id, wallet_type, nickname, external_id, is_active, last_synced_at)
         VALUES ($1, $2, 'blink', $3, $4, TRUE, NOW())
         ON CONFLICT DO NOTHING`,
        [id, req.sessionId, nickname, blinkWallet.walletId]
      );

      // Cache initial transactions
      for (const tx of blinkWallet.transactions) {
        await client.query(
          `INSERT INTO transactions_cache
             (wallet_conn_id, session_id, external_id, direction, amount_sats, fee_sats, memo, occurred_at, kes_rate_at_time, raw)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (wallet_conn_id, external_id) DO NOTHING`,
          [
            id, req.sessionId, tx.externalId, tx.direction,
            tx.amountSats, tx.feeSats, tx.memo,
            tx.occurredAt, rate.kesPerBtc, JSON.stringify(tx.raw),
          ]
        );
      }
      return id;
    });

    res.json({
      walletConnId: connId,
      walletId: blinkWallet.walletId,
      nickname,
      balanceSats: blinkWallet.balanceSats,
      balanceKes: Math.round((blinkWallet.balanceSats / 1e8) * rate.kesPerBtc),
      transactionsCached: blinkWallet.transactions.length,
      hasMore: blinkWallet.hasMore,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      console.error('[wallets/blink]', err);
      res.status(500).json({ error: 'Failed to connect Blink wallet' });
    }
  }
});

/** POST /wallets/byok — connect a generic Lightning API */
router.post('/byok', requireSession, async (req, res) => {
  try {
    const { endpoint, apiKey, nickname } = ConnectByokSchema.parse(req.body);
    const id = randomUUID();

    await query(
      `INSERT INTO wallet_connections
         (id, session_id, wallet_type, nickname, is_active)
       VALUES ($1, $2, 'byok', $3, TRUE)`,
      [id, req.sessionId, nickname]
    );

    // Note: BYOK custom endpoint integration is stub in Phase 1
    // We store the connection; actual data fetch depends on the endpoint format
    res.json({ walletConnId: id, nickname, status: 'connected', note: 'Custom endpoint stored. Manual sync required.' });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else res.status(500).json({ error: 'Failed to connect wallet' });
  }
});

/** GET /wallets — list all connected wallets for session */
router.get('/', requireSession, async (req, res) => {
  try {
    const wallets = await query<{
      id: string; wallet_type: string; nickname: string;
      external_id: string | null; last_synced_at: Date | null; connected_at: Date;
    }>(
      `SELECT id, wallet_type, nickname, external_id, last_synced_at, connected_at
       FROM wallet_connections
       WHERE session_id = $1 AND is_active = TRUE
       ORDER BY connected_at ASC`,
      [req.sessionId]
    );
    res.json(wallets.map((w) => ({
      id: w.id,
      walletType: w.wallet_type,
      externalId: w.external_id,
      nickname: w.nickname,
      status: 'connected',
      lastSyncedAt: w.last_synced_at,
      createdAt: w.connected_at,
    })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

/** GET /wallets/:id/balance — balance for a specific wallet */
router.get('/:id/balance', requireSession, async (req, res) => {
  try {
    const wallet = await queryOne<{ wallet_type: string; nickname: string; session_id: string }>(
      `SELECT wallet_type, nickname, session_id FROM wallet_connections WHERE id = $1 AND is_active = TRUE`,
      [req.params.id]
    );

    if (!wallet || wallet.session_id !== req.sessionId) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const row = await queryOne<{ balance_sats: string }>(
      `SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount_sats ELSE -amount_sats END), 0) as balance_sats
       FROM transactions_cache
       WHERE wallet_conn_id = $1`,
      [req.params.id]
    );

    const rate = await getCurrentRate();
    const sats = parseInt(row?.balance_sats ?? '0', 10);

    res.json({
      walletConnId: req.params.id,
      nickname: wallet.nickname,
      balanceSats: sats,
      balanceKes: Math.round((sats / 1e8) * rate.kesPerBtc),
      kesPerBtc: Math.round(rate.kesPerBtc),
      rateIsStale: rate.isStale,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

/** POST /wallets/:id/sync — re-fetch latest transactions from Blink */
router.post('/:id/sync', requireSession, async (req, res) => {
  try {
    const wallet = await queryOne<{
      wallet_type: string; external_id: string | null; session_id: string;
    }>(
      `SELECT wallet_type, external_id, session_id
       FROM wallet_connections WHERE id = $1 AND is_active = TRUE`,
      [req.params.id]
    );

    if (!wallet || wallet.session_id !== req.sessionId) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    if (wallet.wallet_type !== 'blink') {
      res.status(400).json({ error: 'Sync only supported for Blink wallets in Phase 1' });
      return;
    }

    // API key is not stored server-side; client must resend it for sync
    const { apiKey } = z.object({ apiKey: z.string() }).parse(req.body);
    if (!BlinkConnector.validateKeyFormat(apiKey)) {
      res.status(400).json({ error: 'Invalid API key format' });
      return;
    }

    const connector = new BlinkConnector(apiKey);
    const wallets = await connector.fetchWalletData(50);
    const rate = await getCurrentRate();
    let newTxCount = 0;

    for (const w of wallets) {
      for (const tx of w.transactions) {
        const result = await query<{ external_id: string }>(
          `INSERT INTO transactions_cache
             (wallet_conn_id, session_id, external_id, direction, amount_sats, fee_sats, memo, occurred_at, kes_rate_at_time, raw)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (wallet_conn_id, external_id) DO NOTHING
           RETURNING external_id`,
          [
            req.params.id, req.sessionId, tx.externalId, tx.direction,
            tx.amountSats, tx.feeSats, tx.memo,
            tx.occurredAt, rate.kesPerBtc, JSON.stringify(tx.raw),
          ]
        );
        if (result.length) newTxCount++;
      }
    }

    await query(
      `UPDATE wallet_connections SET last_synced_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    res.json({ synced: true, newTransactions: newTxCount });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else {
      console.error('[wallets/sync]', err);
      res.status(500).json({ error: 'Sync failed' });
    }
  }
});

/** DELETE /wallets/:id — disconnect a wallet */
router.delete('/:id', requireSession, async (req, res) => {
  try {
    const result = await query(
      `UPDATE wallet_connections SET is_active = FALSE
       WHERE id = $1 AND session_id = $2
       RETURNING id`,
      [req.params.id, req.sessionId]
    );
    if (!result.length) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    res.json({ disconnected: true });
  } catch {
    res.status(500).json({ error: 'Failed to disconnect wallet' });
  }
});

// ─── Fedi client-push ─────────────────────────────────────────────────────────

const ConnectFediSchema = z.object({
  federationId: z.string().min(4).max(255),
  nickname: z.string().max(100).default('Fedi Wallet'),
});

const FediPushTxSchema = z.object({
  externalId: z.string().min(1).max(255),
  direction: z.enum(['in', 'out']),
  amountSats: z.number().int().positive(),
  feeSats: z.number().int().min(0).default(0),
  memo: z.string().max(200).nullable().optional(),
  occurredAt: z.string().datetime(),
  raw: z.record(z.unknown()).optional().default({}),
});

const FediPushBatchSchema = z.object({
  transactions: z.array(FediPushTxSchema).min(1).max(500),
});

/** POST /wallets/fedi — register a Fedi federation wallet */
router.post('/fedi', requireSession, async (req, res) => {
  try {
    const { federationId, nickname } = ConnectFediSchema.parse(req.body);
    const id = randomUUID();

    await query(
      `INSERT INTO wallet_connections
         (id, session_id, wallet_type, nickname, external_id, is_active, last_synced_at)
       VALUES ($1, $2, 'fedi', $3, $4, TRUE, NOW())`,
      [id, req.sessionId, nickname, federationId]
    );

    res.json({ walletConnId: id, federationId, nickname, status: 'connected' });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else {
      console.error('[wallets/fedi]', err);
      res.status(500).json({ error: 'Failed to register Fedi wallet' });
    }
  }
});

const ConnectWeblnSchema = z.object({
  externalId: z.string().max(255).nullable().optional(),
  nickname: z.string().max(100).default('Lightning Wallet'),
});

/** POST /wallets/webln|nwc — register a one-click / NWC Lightning wallet */
router.post(['/webln', '/nwc'], requireSession, async (req, res) => {
  const walletType = req.path.endsWith('/nwc') ? 'nwc' : 'webln';
  try {
    const { externalId, nickname } = ConnectWeblnSchema.parse(req.body);
    const id = randomUUID();

    await query(
      `INSERT INTO wallet_connections
         (id, session_id, wallet_type, nickname, external_id, is_active, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, NOW())`,
      [id, req.sessionId, walletType, nickname, externalId ?? null]
    );

    res.json({ walletConnId: id, externalId: externalId ?? null, nickname, status: 'connected' });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else {
      console.error(`[wallets/${walletType}]`, err);
      res.status(500).json({ error: 'Failed to register wallet' });
    }
  }
});

/** POST /wallets/fedi|webln|nwc/:id/push — client pushes a transaction batch */
router.post(['/fedi/:id/push', '/webln/:id/push', '/nwc/:id/push'], requireSession, async (req, res) => {
  try {
    const wallet = await queryOne<{ wallet_type: string; session_id: string }>(
      `SELECT wallet_type, session_id FROM wallet_connections WHERE id = $1 AND is_active = TRUE`,
      [req.params.id]
    );

    if (!wallet || wallet.session_id !== req.sessionId) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    if (wallet.wallet_type !== 'fedi' && wallet.wallet_type !== 'webln' && wallet.wallet_type !== 'nwc') {
      res.status(400).json({ error: 'This endpoint is only for Fedi, WebLN or NWC wallets' });
      return;
    }

    const { transactions } = FediPushBatchSchema.parse(req.body);
    const rate = await getCurrentRate();
    let inserted = 0;

    for (const tx of transactions) {
      const result = await query<{ external_id: string }>(
        `INSERT INTO transactions_cache
           (wallet_conn_id, session_id, external_id, direction, amount_sats, fee_sats, memo, occurred_at, kes_rate_at_time, raw)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (wallet_conn_id, external_id) DO NOTHING
         RETURNING external_id`,
        [
          req.params.id, req.sessionId, tx.externalId, tx.direction,
          tx.amountSats, tx.feeSats, tx.memo ?? null,
          new Date(tx.occurredAt), rate.kesPerBtc, JSON.stringify(tx.raw),
        ]
      );
      if (result.length) inserted++;
    }

    await query(
      `UPDATE wallet_connections SET last_synced_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    res.json({ pushed: transactions.length, inserted, skipped: transactions.length - inserted });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else {
      console.error('[wallets/fedi/push]', err);
      res.status(500).json({ error: 'Failed to push transactions' });
    }
  }
});

export default router;
