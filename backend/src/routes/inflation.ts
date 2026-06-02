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

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const ADMIN_ROLES = ['community-admin', 'super-admin', 'field-officer'];

type AdminUser = { user_id: string; role: string; community_id: string | null };

function getAdminUser(req: import('express').Request): AdminUser {
  return (req as import('express').Request & { inflationUser: AdminUser }).inflationUser;
}

function canAccessCommunity(u: AdminUser, communityId: string): boolean {
  return u.role === 'super-admin' || u.community_id === communityId;
}

/** GET /inflation/admin/summary?community_id= */
router.get('/admin/summary', requireAuth(ADMIN_ROLES), async (req, res) => {
  const u = getAdminUser(req);
  const communityId = (req.query.community_id as string) ?? u.community_id;
  if (!communityId) { res.status(400).json({ error: 'community_id required' }); return; }
  if (!canAccessCommunity(u, communityId)) { res.status(403).json({ error: 'Access denied' }); return; }
  try {
    const stats = await queryOne<{
      total_purchases: number; items_tracked: number; contributors: number;
      merchants_active: number; bitcoin_purchases: number; pending_review: number;
    }>(
      `SELECT
        COUNT(*)::int total_purchases,
        COUNT(DISTINCT item_name)::int items_tracked,
        COUNT(DISTINCT captured_by)::int contributors,
        COUNT(DISTINCT merchant_id)::int merchants_active,
        SUM(CASE WHEN payment_method = 'bitcoin' THEN 1 ELSE 0 END)::int bitcoin_purchases,
        COUNT(CASE WHEN verification_status = 'unverified' THEN 1 END)::int pending_review
       FROM inflation_purchases
       WHERE community_id = $1 AND verification_status != 'rejected'`,
      [communityId]
    );
    res.json(stats ?? { total_purchases: 0, items_tracked: 0, contributors: 0, merchants_active: 0, bitcoin_purchases: 0, pending_review: 0 });
  } catch (err) { console.error('[admin/summary]', err); res.status(500).json({ error: 'Failed' }); }
});

/** GET /inflation/admin/price-trends?community_id=&days=90 */
router.get('/admin/price-trends', requireAuth(ADMIN_ROLES), async (req, res) => {
  const u = getAdminUser(req);
  const communityId = (req.query.community_id as string) ?? u.community_id;
  const days = Math.min(parseInt(req.query.days as string) || 90, 365);
  if (!communityId) { res.status(400).json({ error: 'community_id required' }); return; }
  if (!canAccessCommunity(u, communityId)) { res.status(403).json({ error: 'Access denied' }); return; }
  try {
    const rows = await query<{
      item_name: string; category: string; week: string;
      avg_kes: number; avg_sats: number | null; count: number;
    }>(
      `SELECT
        item_name, category,
        TO_CHAR(DATE_TRUNC('week', capture_date), 'YYYY-MM-DD') week,
        ROUND(AVG(price_kes / NULLIF(quantity, 0))::numeric, 2)::float avg_kes,
        ROUND(AVG(CASE WHEN sats_paid IS NOT NULL THEN sats_paid::float / NULLIF(quantity, 0) END)::numeric, 0)::float avg_sats,
        COUNT(*)::int count
       FROM inflation_purchases
       WHERE community_id = $1 AND verification_status != 'rejected'
         AND capture_date >= CURRENT_DATE - ($2 || ' days')::interval
       GROUP BY item_name, category, DATE_TRUNC('week', capture_date)
       ORDER BY item_name, week`,
      [communityId, days]
    );
    res.json(rows);
  } catch (err) { console.error('[admin/price-trends]', err); res.status(500).json({ error: 'Failed' }); }
});

/** GET /inflation/admin/review-queue?community_id= */
router.get('/admin/review-queue', requireAuth(['community-admin', 'super-admin']), async (req, res) => {
  const u = getAdminUser(req);
  const communityId = (req.query.community_id as string) ?? u.community_id;
  if (!communityId) { res.status(400).json({ error: 'community_id required' }); return; }
  if (!canAccessCommunity(u, communityId)) { res.status(403).json({ error: 'Access denied' }); return; }
  try {
    const rows = await query(
      `SELECT p.id, p.item_name, p.category, p.quantity, p.unit, p.price_kes,
              p.payment_method, p.sats_paid, p.capture_date, p.notes,
              p.verification_status, p.created_at, u.display_name contributor
       FROM inflation_purchases p
       JOIN inflation_users u ON u.id = p.captured_by
       WHERE p.community_id = $1 AND p.verification_status = 'unverified'
       ORDER BY p.created_at DESC LIMIT 100`,
      [communityId]
    );
    res.json(rows);
  } catch (err) { console.error('[admin/review-queue]', err); res.status(500).json({ error: 'Failed' }); }
});

/** PATCH /inflation/admin/review/:id */
router.patch('/admin/review/:id', requireAuth(['community-admin', 'super-admin']), async (req, res) => {
  const u = getAdminUser(req);
  const { status } = req.body;
  if (!['admin-reviewed', 'flagged', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid status. Use: admin-reviewed, flagged, rejected' }); return;
  }
  try {
    const purchase = await queryOne<{ community_id: string }>(
      `SELECT community_id FROM inflation_purchases WHERE id = $1`, [req.params.id]
    );
    if (!purchase) { res.status(404).json({ error: 'Not found' }); return; }
    if (!canAccessCommunity(u, purchase.community_id)) { res.status(403).json({ error: 'Access denied' }); return; }
    await query(`UPDATE inflation_purchases SET verification_status = $1 WHERE id = $2`, [status, req.params.id]);
    res.json({ ok: true, status });
  } catch (err) { console.error('[admin/review/:id]', err); res.status(500).json({ error: 'Failed' }); }
});

/** GET /inflation/admin/category-breakdown?community_id= */
router.get('/admin/category-breakdown', requireAuth(ADMIN_ROLES), async (req, res) => {
  const u = getAdminUser(req);
  const communityId = (req.query.community_id as string) ?? u.community_id;
  if (!communityId) { res.status(400).json({ error: 'community_id required' }); return; }
  if (!canAccessCommunity(u, communityId)) { res.status(403).json({ error: 'Access denied' }); return; }
  try {
    const rows = await query(
      `SELECT
        category, COUNT(*)::int total,
        ROUND(AVG(price_kes / NULLIF(quantity, 0))::numeric, 2)::float avg_kes_per_unit,
        COUNT(CASE WHEN payment_method = 'bitcoin' THEN 1 END)::int bitcoin_count
       FROM inflation_purchases
       WHERE community_id = $1 AND verification_status != 'rejected'
       GROUP BY category ORDER BY total DESC`,
      [communityId]
    );
    res.json(rows);
  } catch (err) { console.error('[admin/category-breakdown]', err); res.status(500).json({ error: 'Failed' }); }
});

// ─── Public Reports ───────────────────────────────────────────────────────────

/** GET /inflation/reports/latest?community_id= */
router.get('/reports/latest', async (req, res) => {
  const communityId = req.query.community_id as string;
  if (!communityId) { res.status(400).json({ error: 'community_id required' }); return; }
  try {
    const latest = await queryOne<{ month: string }>(
      `SELECT TO_CHAR(DATE_TRUNC('month', MAX(capture_date)), 'YYYY-MM') month
       FROM inflation_purchases WHERE community_id = $1 AND verification_status != 'rejected'`,
      [communityId]
    );
    if (!latest?.month) { res.json({ month: null, items: [], adoption: null }); return; }
    const [items, adoption] = await Promise.all([
      query(
        `SELECT item_name, category,
          ROUND(AVG(price_kes / NULLIF(quantity, 0))::numeric, 2)::float avg_kes_per_unit,
          ROUND(AVG(CASE WHEN sats_paid IS NOT NULL THEN sats_paid::float / NULLIF(quantity, 0) END)::numeric, 0)::float avg_sats_per_unit,
          COUNT(*)::int data_points
         FROM inflation_purchases
         WHERE community_id = $1 AND verification_status != 'rejected'
           AND TO_CHAR(DATE_TRUNC('month', capture_date), 'YYYY-MM') = $2
         GROUP BY item_name, category HAVING COUNT(*) >= 5 ORDER BY category, item_name`,
        [communityId, latest.month]
      ),
      queryOne<{ total: number; bitcoin: number }>(
        `SELECT COUNT(*)::int total,
          SUM(CASE WHEN payment_method = 'bitcoin' THEN 1 ELSE 0 END)::int bitcoin
         FROM inflation_purchases WHERE community_id = $1 AND verification_status != 'rejected'
           AND TO_CHAR(DATE_TRUNC('month', capture_date), 'YYYY-MM') = $2`,
        [communityId, latest.month]
      ),
    ]);
    res.json({ month: latest.month, items, adoption });
  } catch (err) { console.error('[reports/latest]', err); res.status(500).json({ error: 'Failed' }); }
});

/** GET /inflation/reports/:month?community_id=  — format YYYY-MM */
router.get('/reports/:month', async (req, res) => {
  const communityId = req.query.community_id as string;
  const { month } = req.params;
  if (!communityId) { res.status(400).json({ error: 'community_id required' }); return; }
  if (!/^\d{4}-\d{2}$/.test(month)) { res.status(400).json({ error: 'month must be YYYY-MM' }); return; }
  try {
    const prevDate = new Date(`${month}-01`);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);
    const [items, prevItems, adoption] = await Promise.all([
      query(
        `SELECT item_name, category,
          ROUND(AVG(price_kes / NULLIF(quantity, 0))::numeric, 2)::float avg_kes_per_unit,
          ROUND(AVG(CASE WHEN sats_paid IS NOT NULL THEN sats_paid::float / NULLIF(quantity, 0) END)::numeric, 0)::float avg_sats_per_unit,
          COUNT(*)::int data_points
         FROM inflation_purchases
         WHERE community_id = $1 AND verification_status != 'rejected'
           AND TO_CHAR(DATE_TRUNC('month', capture_date), 'YYYY-MM') = $2
         GROUP BY item_name, category HAVING COUNT(*) >= 5 ORDER BY category, item_name`,
        [communityId, month]
      ),
      query(
        `SELECT item_name,
          ROUND(AVG(price_kes / NULLIF(quantity, 0))::numeric, 2)::float avg_kes_per_unit
         FROM inflation_purchases
         WHERE community_id = $1 AND verification_status != 'rejected'
           AND TO_CHAR(DATE_TRUNC('month', capture_date), 'YYYY-MM') = $2
         GROUP BY item_name HAVING COUNT(*) >= 5`,
        [communityId, prevMonth]
      ),
      queryOne<{ total: number; bitcoin: number }>(
        `SELECT COUNT(*)::int total,
          SUM(CASE WHEN payment_method = 'bitcoin' THEN 1 ELSE 0 END)::int bitcoin
         FROM inflation_purchases WHERE community_id = $1 AND verification_status != 'rejected'
           AND TO_CHAR(DATE_TRUNC('month', capture_date), 'YYYY-MM') = $2`,
        [communityId, month]
      ),
    ]);
    res.json({ month, items, prevItems, adoption });
  } catch (err) { console.error('[reports/:month]', err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
