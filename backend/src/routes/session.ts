import { Router } from 'express';
import { z } from 'zod';
import { createSession, signSessionToken, setSessionLanguage, getSession } from '../utils/session';
import { requireSession } from '../middleware/auth';
import { query } from '../db/client';

const router = Router();

const StartSchema = z.object({
  language: z.enum(['en', 'sw', 'shg']).default('sw'),
});

/** POST /session — create a new session, returns JWT */
router.post('/', async (req, res) => {
  try {
    const { language } = StartSchema.parse(req.body);
    const sessionId = await createSession(language);
    const token = signSessionToken(sessionId);
    res.json({ sessionId, token, language });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      console.error('[session/create]', err);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
});

/** GET /session/me — verify session and return info */
router.get('/me', requireSession, async (req, res) => {
  try {
    const session = await getSession(req.sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const wallets = await query<{ id: string; nickname: string; wallet_type: string; is_active: boolean }>(
      `SELECT id, nickname, wallet_type, is_active
       FROM wallet_connections
       WHERE session_id = $1 AND is_active = TRUE`,
      [req.sessionId]
    );

    res.json({ ...session, wallets });
  } catch {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/** PATCH /session/language — update language preference */
router.patch('/language', requireSession, async (req, res) => {
  try {
    const { language } = z.object({ language: z.enum(['en', 'sw', 'shg']) }).parse(req.body);
    await setSessionLanguage(req.sessionId, language);
    res.json({ language });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else res.status(500).json({ error: 'Failed to update language' });
  }
});

export default router;
