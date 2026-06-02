import { Router } from 'express';
import { z } from 'zod';
import { createHash, randomBytes } from 'crypto';
import { query, queryOne } from '../db/client';
import { randomUUID } from 'crypto';
import { getCurrentRate } from '../connectors/coingecko';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

async function requireInflationAuth(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
  allowedRoles?: string[],
) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }

  const tokenHash = sha256(token);
  const row = await queryOne<{
    user_id: string; role: string; community_id: string | null;
    display_name: string; consent_given: boolean; expires_at: Date;
  }>(
    `SELECT s.user_id, u.role, u.community_id, u.display_name, u.consent_given, s.expires_at
     FROM inflation_sessions s
     JOIN inflation_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND u.active = TRUE`,
    [tokenHash]
  ).catch(() => null);

  if (!row || row.expires_at < new Date()) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }
  if (allowedRoles && !allowedRoles.includes(row.role)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }
  (req as import('express').Request & { inflationUser: typeof row }).inflationUser = row;
  next();
}

function requireAuth(roles?: string[]) {
  return (
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) => requireInflationAuth(req, res, next, roles);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  display_name: z.string().min(2).max(100),
  role: z.enum(['household', 'merchant', 'field-officer', 'community-admin', 'super-admin']).default('household'),
  community_id: z.string().uuid().optional(),
  phone: z.string().max(20).optional(),
  pin: z.string().min(4).max(20),
  consent_given: z.boolean().default(false),
});

/** POST /inflation/auth/register */
router.post('/auth/register', async (req, res) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const pinHash = sha256(data.pin);
    const phoneHash = data.phone ? sha256(data.phone.replace(/\s/g, '')) : null;

    const id = randomUUID();
    await query(
      `INSERT INTO inflation_users
         (id, display_name, role, community_id, phone_hash, pin_hash, consent_given)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, data.display_name, data.role, data.community_id ?? null, phoneHash, pinHash, data.consent_given]
    );

    const token = generateToken();
    const tokenHash = sha256(token);
    await query(
      `INSERT INTO inflation_sessions (user_id, token_hash) VALUES ($1, $2)`,
      [id, tokenHash]
    );

    res.json({
      token,
      user: { id, display_name: data.display_name, role: data.role, community_id: data.community_id ?? null, consent_given: data.consent_given },
    });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else { console.error('[inflation/register]', err); res.status(500).json({ error: 'Registration failed' }); }
  }
});

const LoginSchema = z.object({
  phone: z.string().max(20).optional(),
  display_name: z.string().max(100).optional(),
  pin: z.string().min(4),
}).refine((d) => d.phone || d.display_name, { message: 'Provide phone or display_name' });

/** POST /inflation/auth/login */
router.post('/auth/login', async (req, res) => {
  try {
    const data = LoginSchema.parse(req.body);
    const pinHash = sha256(data.pin);

    let user: { id: string; display_name: string; role: string; community_id: string | null; consent_given: boolean } | null = null;

    if (data.phone) {
      const phoneHash = sha256(data.phone.replace(/\s/g, ''));
      user = await queryOne(
        `SELECT id, display_name, role, community_id, consent_given
         FROM inflation_users WHERE phone_hash = $1 AND pin_hash = $2 AND active = TRUE`,
        [phoneHash, pinHash]
      );
    } else if (data.display_name) {
      user = await queryOne(
        `SELECT id, display_name, role, community_id, consent_given
         FROM inflation_users WHERE display_name = $1 AND pin_hash = $2 AND active = TRUE LIMIT 1`,
        [data.display_name, pinHash]
      );
    }

    if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    const token = generateToken();
    const tokenHash = sha256(token);
    await query(
      `INSERT INTO inflation_sessions (user_id, token_hash) VALUES ($1, $2)`,
      [user.id, tokenHash]
    );

    res.json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else { console.error('[inflation/login]', err); res.status(500).json({ error: 'Login failed' }); }
  }
});

/** POST /inflation/auth/consent — record user consent */
router.post('/auth/consent', requireAuth(), async (req, res) => {
  const u = (req as import('express').Request & { inflationUser: { user_id: string } }).inflationUser;
  try {
    await query(`UPDATE inflation_users SET consent_given = TRUE WHERE id = $1`, [u.user_id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to record consent' }); }
});

/** GET /inflation/auth/me */
router.get('/auth/me', requireAuth(), (req, res) => {
  const u = (req as import('express').Request & { inflationUser: Record<string, unknown> }).inflationUser;
  res.json({ user: u });
});

// ─── Communities ──────────────────────────────────────────────────────────────

/** GET /inflation/communities */
router.get('/communities', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, city, country, currency, currency_symbol, joined_date
       FROM inflation_communities WHERE active = TRUE ORDER BY name`
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed to fetch communities' }); }
});

// ─── Items ────────────────────────────────────────────────────────────────────

/** GET /inflation/items */
router.get('/items', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT id, name_english, name_swahili, category, standard_quantity, standard_unit
       FROM inflation_items WHERE active = TRUE ORDER BY category, name_english`
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed to fetch items' }); }
});

// ─── Merchants ────────────────────────────────────────────────────────────────

/** GET /inflation/communities/:id/merchants */
router.get('/communities/:id/merchants', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, category, accepts_bitcoin
       FROM inflation_merchants WHERE community_id = $1 AND active = TRUE ORDER BY name`,
      [req.params.id]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed to fetch merchants' }); }
});

// ─── Purchases ────────────────────────────────────────────────────────────────

const PurchaseSchema = z.object({
  item_id: z.string().uuid().optional(),
  item_name: z.string().min(1).max(200),
  category: z.string().max(50).default('other'),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(30),
  price_kes: z.number().positive(),
  payment_method: z.enum(['cash', 'mpesa', 'bitcoin', 'other']).default('cash'),
  sats_paid: z.number().int().positive().optional(),
  merchant_id: z.string().uuid().optional(),
  community_id: z.string().uuid(),
  capture_date: z.string().date().optional(),
  notes: z.string().max(500).optional(),
  offline_id: z.string().max(100).optional(),
});

/** POST /inflation/purchases */
router.post('/purchases', requireAuth(), async (req, res) => {
  const u = (req as import('express').Request & { inflationUser: { user_id: string; consent_given: boolean } }).inflationUser;
  if (!u.consent_given) {
    res.status(403).json({ error: 'Consent required before logging data' });
    return;
  }
  try {
    const data = PurchaseSchema.parse(req.body);

    let btcKesRate: number | null = null;
    if (data.payment_method === 'bitcoin' || data.sats_paid) {
      try {
        const rate = await getCurrentRate();
        btcKesRate = rate.kesPerBtc;
      } catch { /* rate unavailable — record without it */ }
    }

    const id = randomUUID();
    const captureDate = data.capture_date ?? new Date().toISOString().slice(0, 10);

    await query(
      `INSERT INTO inflation_purchases
         (id, item_id, item_name, category, quantity, unit, price_kes, payment_method,
          sats_paid, btc_kes_rate, merchant_id, community_id, captured_by, capture_date, notes, offline_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        id, data.item_id ?? null, data.item_name, data.category,
        data.quantity, data.unit, data.price_kes, data.payment_method,
        data.sats_paid ?? null, btcKesRate,
        data.merchant_id ?? null, data.community_id,
        u.user_id, captureDate,
        data.notes ?? null, data.offline_id ?? null,
      ]
    );

    res.status(201).json({ id, captureDate, btcKesRate });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else { console.error('[inflation/purchases]', err); res.status(500).json({ error: 'Failed to save purchase' }); }
  }
});

/** POST /inflation/purchases/batch — offline sync: submit multiple queued purchases */
const BatchSchema = z.object({
  purchases: z.array(PurchaseSchema).min(1).max(100),
});

router.post('/purchases/batch', requireAuth(), async (req, res) => {
  const u = (req as import('express').Request & { inflationUser: { user_id: string; consent_given: boolean } }).inflationUser;
  if (!u.consent_given) {
    res.status(403).json({ error: 'Consent required before logging data' });
    return;
  }
  try {
    const { purchases } = BatchSchema.parse(req.body);
    let rate: number | null = null;
    try { rate = (await getCurrentRate()).kesPerBtc; } catch { /* best-effort */ }

    let inserted = 0;
    const ids: string[] = [];
    for (const data of purchases) {
      const id = randomUUID();
      const btcKesRate = (data.payment_method === 'bitcoin' || data.sats_paid) ? rate : null;
      const captureDate = data.capture_date ?? new Date().toISOString().slice(0, 10);
      await query(
        `INSERT INTO inflation_purchases
           (id, item_id, item_name, category, quantity, unit, price_kes, payment_method,
            sats_paid, btc_kes_rate, merchant_id, community_id, captured_by, capture_date, notes, offline_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (offline_id) DO NOTHING`,
        [
          id, data.item_id ?? null, data.item_name, data.category,
          data.quantity, data.unit, data.price_kes, data.payment_method,
          data.sats_paid ?? null, btcKesRate,
          data.merchant_id ?? null, data.community_id,
          u.user_id, captureDate,
          data.notes ?? null, data.offline_id ?? null,
        ]
      ).catch(() => null);
      inserted++;
      ids.push(id);
    }

    res.json({ submitted: purchases.length, inserted, ids });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else { console.error('[inflation/batch]', err); res.status(500).json({ error: 'Batch sync failed' }); }
  }
});

export default router;
