import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { query, queryOne, withTransaction } from '../db/client';
import { config } from '../config';
import { getCurrentRate } from '../connectors/coingecko';

const router = Router();

const SUPERVISOR_FEE_PCT = 0.10;
const PORTAL = config.portalUrl;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Per-collector QR token: HMAC(globalSecret, displayId + qrSecret), 32 hex chars. */
function computeQrToken(displayId: string, qrSecret: string): string {
  return createHmac('sha256', config.takaSats.hmacSecret)
    .update(`${displayId}:${qrSecret}`)
    .digest('hex')
    .slice(0, 32);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Stateless identity token for collectors/supervisors: base64(role:id).sig */
function signIdentity(role: string, id: string): string {
  const payload = Buffer.from(`${role}:${id}`).toString('base64url');
  const sig = createHmac('sha256', config.takaSats.hmacSecret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyIdentity(token: string | undefined): { role: string; id: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', config.takaSats.hmacSecret).update(payload).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  const [role, id] = Buffer.from(payload, 'base64url').toString().split(':');
  if (!role || !id) return null;
  return { role, id };
}

function bearer(req: Request): string | undefined {
  const auth = req.headers.authorization;
  return auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
}

function requireRole(role: 'collector' | 'supervisor') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = verifyIdentity(bearer(req));
    if (!id || id.role !== role) { res.status(401).json({ error: 'Authentication required' }); return; }
    (req as Request & { takaId: string }).takaId = id.id;
    next();
  };
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!config.takaSats.adminToken || !token || !safeEqual(token, config.takaSats.adminToken)) {
    res.status(401).json({ error: 'Admin authentication required' });
    return;
  }
  next();
}

function qrUrl(displayId: string, qrSecret: string): string {
  return `${PORTAL}/taka-sats/verify?id=${displayId}&k=${computeQrToken(displayId, qrSecret)}`;
}

async function activeRate(material: string): Promise<number | null> {
  const row = await queryOne<{ kes_per_kg: string }>(
    `SELECT kes_per_kg FROM taka_sats.payout_rates
     WHERE material_type = $1 AND effective_to IS NULL
     ORDER BY effective_from DESC LIMIT 1`,
    [material],
  );
  return row ? parseFloat(row.kes_per_kg) : null;
}

// ─── Role detection ────────────────────────────────────────────────────────────

const IdentifySchema = z.object({
  wallet_type: z.enum(['fedi', 'blink', 'machankura']),
  member_key: z.string().max(255).optional(),
  wallet_address: z.string().max(255).optional(),
});

/** POST /taka-sats/auth/identify — route a connecting wallet to collector / supervisor / user. */
router.post('/auth/identify', async (req, res) => {
  try {
    const data = IdentifySchema.parse(req.body);

    if (data.member_key) {
      const sup = await queryOne<{ id: string; display_name: string; assigned_points: string[] }>(
        `SELECT id, display_name, assigned_points FROM taka_sats.supervisors
         WHERE fedi_member_key = $1 AND active = TRUE`,
        [data.member_key],
      );
      if (sup) {
        res.json({
          role: 'supervisor',
          token: signIdentity('supervisor', sup.id),
          supervisor_id: sup.id,
          display_name: sup.display_name,
          assigned_points: sup.assigned_points,
        });
        return;
      }
    }

    const matchKey = data.wallet_address ?? data.member_key ?? '';
    if (matchKey) {
      const col = await queryOne<{ id: string; display_id: string; name: string; status: string }>(
        `SELECT id, display_id, name, status FROM taka_sats.collectors
         WHERE wallet_address = $1`,
        [matchKey],
      );
      if (col) {
        res.json({
          role: 'collector',
          token: signIdentity('collector', col.id),
          collector_id: col.id,
          display_id: col.display_id,
          display_name: col.name,
          status: col.status,
        });
        return;
      }
    }

    res.json({ role: 'user' });
  } catch (err) {
    res.status(400).json({ error: err instanceof z.ZodError ? err.errors : 'Invalid request' });
  }
});

// ─── QR verification (supervisor scan) ──────────────────────────────────────────

async function loadCollectorByQr(displayId: string, k: string) {
  const col = await queryOne<{
    id: string; display_id: string; name: string; status: string;
    qr_secret: string; registered_at: Date; wallet_type: string;
  }>(
    `SELECT id, display_id, name, status, qr_secret, registered_at, wallet_type
     FROM taka_sats.collectors WHERE display_id = $1`,
    [displayId],
  );
  if (!col) return null;
  if (!safeEqual(k, computeQrToken(col.display_id, col.qr_secret))) return null;
  return col;
}

async function collectorStats(collectorId: string) {
  const row = await queryOne<{ lifetime: string; last_at: Date | null }>(
    `SELECT COALESCE(SUM(collector_sats),0) AS lifetime, MAX(verified_at) AS last_at
     FROM taka_sats.collections WHERE collector_id = $1 AND status = 'completed'`,
    [collectorId],
  );
  return { lifetime: parseInt(row?.lifetime ?? '0', 10), lastAt: row?.last_at ?? null };
}

/** GET /taka-sats/verify?id=&k= — used by supervisor scanner to confirm a card. */
router.get('/verify', async (req, res) => {
  const id = String(req.query.id ?? '');
  const k = String(req.query.k ?? '');
  if (!id || !k) { res.status(400).json({ valid: false, error: 'Missing id or token' }); return; }

  const col = await loadCollectorByQr(id, k);
  if (!col) { res.status(404).json({ valid: false, error: 'Invalid card' }); return; }
  if (col.status !== 'active') { res.json({ valid: false, error: `Card ${col.status}`, status: col.status }); return; }

  const stats = await collectorStats(col.id);
  res.json({
    valid: true,
    collector_id: col.id,
    display_id: col.display_id,
    name: col.name,
    status: col.status,
    member_since: col.registered_at,
    last_collection: stats.lastAt,
    lifetime_sats: stats.lifetime,
  });
});

// ─── Collector endpoints ────────────────────────────────────────────────────────

/** GET /taka-sats/collector/me — card + headline stats. */
router.get('/collector/me', requireRole('collector'), async (req, res) => {
  const id = (req as Request & { takaId: string }).takaId;
  const col = await queryOne<{
    display_id: string; name: string; status: string; registered_at: Date;
    wallet_type: string; qr_secret: string; community_id: string | null;
  }>(
    `SELECT display_id, name, status, registered_at, wallet_type, qr_secret, community_id
     FROM taka_sats.collectors WHERE id = $1`,
    [id],
  );
  if (!col) { res.status(404).json({ error: 'Collector not found' }); return; }

  const stats = await collectorStats(id);
  const month = await queryOne<{ s: string; c: string }>(
    `SELECT COALESCE(SUM(collector_sats),0) AS s, COUNT(*) AS c
     FROM taka_sats.collections
     WHERE collector_id = $1 AND status = 'completed'
       AND date_trunc('month', verified_at) = date_trunc('month', NOW())`,
    [id],
  );
  const rankRow = await queryOne<{ rank: string }>(
    `WITH board AS (
       SELECT collector_id, SUM(collector_sats) AS total
       FROM taka_sats.collections
       WHERE status = 'completed' AND date_trunc('month', verified_at) = date_trunc('month', NOW())
       GROUP BY collector_id)
     SELECT rank FROM (
       SELECT collector_id, RANK() OVER (ORDER BY total DESC) AS rank FROM board
     ) r WHERE collector_id = $1`,
    [id],
  );
  const total = await queryOne<{ c: string }>(
    `SELECT COUNT(*) AS c FROM taka_sats.collections WHERE collector_id = $1 AND status = 'completed'`,
    [id],
  );

  res.json({
    display_id: col.display_id,
    name: col.name,
    status: col.status,
    member_since: col.registered_at,
    wallet_type: col.wallet_type,
    qr_url: qrUrl(col.display_id, col.qr_secret),
    lifetime_sats: stats.lifetime,
    this_month_sats: parseInt(month?.s ?? '0', 10),
    collections_total: parseInt(total?.c ?? '0', 10),
    rank: rankRow ? parseInt(rankRow.rank, 10) : null,
  });
});

/** GET /taka-sats/collector/history */
router.get('/collector/history', requireRole('collector'), async (req, res) => {
  const id = (req as Request & { takaId: string }).takaId;
  const rows = await query(
    `SELECT c.collection_ref, c.material_type, c.weight_kg, c.collector_sats,
            c.collection_point, c.status, c.verified_at, s.display_name AS supervisor
     FROM taka_sats.collections c
     JOIN taka_sats.supervisors s ON s.id = c.supervisor_id
     WHERE c.collector_id = $1
     ORDER BY c.verified_at DESC LIMIT 200`,
    [id],
  );
  res.json(rows);
});

/** GET /taka-sats/leaderboard?community_id= */
router.get('/leaderboard', async (req, res) => {
  const community = req.query.community_id ? String(req.query.community_id) : null;
  const rows = await query(
    `SELECT col.display_id, col.name, SUM(c.collector_sats)::int AS month_sats
     FROM taka_sats.collections c
     JOIN taka_sats.collectors col ON col.id = c.collector_id
     WHERE c.status = 'completed'
       AND date_trunc('month', c.verified_at) = date_trunc('month', NOW())
       AND ($1::uuid IS NULL OR col.community_id = $1)
     GROUP BY col.display_id, col.name
     ORDER BY month_sats DESC LIMIT 20`,
    [community],
  );
  res.json(rows);
});

// ─── Supervisor endpoints ────────────────────────────────────────────────────────

/** GET /taka-sats/supervisor/me */
router.get('/supervisor/me', requireRole('supervisor'), async (req, res) => {
  const id = (req as Request & { takaId: string }).takaId;
  const sup = await queryOne<{ display_name: string; assigned_points: string[]; active: boolean }>(
    `SELECT display_name, assigned_points, active FROM taka_sats.supervisors WHERE id = $1`,
    [id],
  );
  if (!sup || !sup.active) { res.status(404).json({ error: 'Supervisor not found' }); return; }
  res.json({
    display_name: sup.display_name,
    assigned_points: sup.assigned_points,
    payment_mode: 'fedi-webln',
  });
});

/** POST /taka-sats/supervisor/scan — { id, k } */
router.post('/supervisor/scan', requireRole('supervisor'), async (req, res) => {
  const { id, k } = req.body ?? {};
  if (!id || !k) { res.status(400).json({ valid: false, error: 'Missing card data' }); return; }
  const col = await loadCollectorByQr(String(id), String(k));
  if (!col) { res.json({ valid: false, error: 'Invalid card. Do not proceed.' }); return; }
  if (col.status !== 'active') { res.json({ valid: false, error: `Card ${col.status}`, status: col.status }); return; }
  const stats = await collectorStats(col.id);
  res.json({
    valid: true,
    collector_id: col.id,
    display_id: col.display_id,
    name: col.name,
    member_since: col.registered_at,
    last_collection: stats.lastAt,
    lifetime_sats: stats.lifetime,
  });
});

const CollectionSchema = z.object({
  collector_id: z.string().uuid(),
  material_type: z.enum(['plastic', 'metal', 'paper', 'mixed', 'other']),
  weight_kg: z.number().positive().max(10000),
  collection_point: z.string().min(1).max(120),
  notes: z.string().max(500).optional(),
});

/** POST /taka-sats/supervisor/collections — log collection, return payment instructions. */
router.post('/supervisor/collections', requireRole('supervisor'), async (req, res) => {
  const supervisorId = (req as Request & { takaId: string }).takaId;
  let data: z.infer<typeof CollectionSchema>;
  try { data = CollectionSchema.parse(req.body); }
  catch (err) { res.status(400).json({ error: err instanceof z.ZodError ? err.errors : 'Invalid request' }); return; }

  const sup = await queryOne<{ active: boolean }>(
    `SELECT active FROM taka_sats.supervisors WHERE id = $1`, [supervisorId],
  );
  if (!sup || !sup.active) { res.status(403).json({ error: 'Supervisor inactive' }); return; }

  const col = await queryOne<{ display_id: string; name: string; status: string; wallet_address: string | null; wallet_type: string }>(
    `SELECT display_id, name, status, wallet_address, wallet_type FROM taka_sats.collectors WHERE id = $1`,
    [data.collector_id],
  );
  if (!col || col.status !== 'active') { res.status(400).json({ error: 'Collector not active' }); return; }
  if (!col.wallet_address) { res.status(400).json({ error: 'Collector has no wallet address' }); return; }

  const kesPerKg = await activeRate(data.material_type);
  if (kesPerKg === null) { res.status(400).json({ error: 'No active rate for material' }); return; }

  let kesPerBtc: number;
  try { kesPerBtc = (await getCurrentRate()).kesPerBtc; }
  catch { res.status(503).json({ error: 'BTC/KES rate unavailable' }); return; }

  const satsPerKg = (kesPerKg / kesPerBtc) * 100_000_000;
  const collectorSats = Math.floor(data.weight_kg * satsPerKg);
  const supervisorSats = Math.floor(collectorSats * SUPERVISOR_FEE_PCT);
  const totalSats = collectorSats + supervisorSats;

  const today = new Date().toISOString().slice(0, 10);
  const seqRow = await queryOne<{ c: string }>(
    `SELECT COUNT(*) AS c FROM taka_sats.collections WHERE date_trunc('day', verified_at) = CURRENT_DATE`,
  );
  const seq = String(parseInt(seqRow?.c ?? '0', 10) + 1).padStart(3, '0');
  const collectorNum = col.display_id.replace(/[^0-9]/g, '') || '000';
  const ref = `TS-${today}-${collectorNum}-${seq}`;
  const collectionId = randomUUID();

  await query(
    `INSERT INTO taka_sats.collections
      (id, collection_ref, collector_id, supervisor_id, collection_point, material_type,
       weight_kg, kes_rate_per_kg, btc_kes_rate, collector_sats, supervisor_sats, total_sats, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',$13)`,
    [collectionId, ref, data.collector_id, supervisorId, data.collection_point, data.material_type,
     data.weight_kg, kesPerKg, kesPerBtc, collectorSats, supervisorSats, totalSats, data.notes ?? null],
  );

  res.json({
    status: 'pending', collection_id: collectionId, collection_ref: ref,
    collector_sats: collectorSats, supervisor_sats: supervisorSats, total_sats: totalSats,
    kes_per_btc: kesPerBtc, kes_equivalent: Math.round((collectorSats / 100_000_000) * kesPerBtc * 100) / 100,
    collector_wallet_address: col.wallet_address, collector_wallet_type: col.wallet_type,
    collector_name: col.name, memo: `Taka Sats ${ref}`,
  });
});

const ResultSchema = z.object({
  success: z.boolean(),
  preimage: z.string().max(512).optional(),
  error: z.string().max(500).optional(),
});

/** POST /taka-sats/supervisor/collections/:id/result — record WebLN payment outcome. */
router.post('/supervisor/collections/:id/result', requireRole('supervisor'), async (req, res) => {
  const supervisorId = (req as Request & { takaId: string }).takaId;
  const id = String(req.params.id);
  let body: z.infer<typeof ResultSchema>;
  try { body = ResultSchema.parse(req.body); }
  catch (err) { res.status(400).json({ error: err instanceof z.ZodError ? err.errors : 'Invalid request' }); return; }

  const row = await queryOne<{ status: string; collection_ref: string; collector_sats: string; supervisor_sats: string }>(
    `SELECT status, collection_ref, collector_sats, supervisor_sats
     FROM taka_sats.collections WHERE id = $1 AND supervisor_id = $2`,
    [id, supervisorId],
  );
  if (!row) { res.status(404).json({ error: 'Collection not found' }); return; }
  if (row.status !== 'pending') { res.status(409).json({ error: `Collection already ${row.status}` }); return; }

  if (body.success) {
    await query(
      `UPDATE taka_sats.collections
         SET status = 'completed', collector_tx_id = $2, paid_at = NOW()
       WHERE id = $1`,
      [id, body.preimage ?? null],
    );
    res.json({ status: 'completed', collection_ref: row.collection_ref });
    return;
  }

  await query(
    `UPDATE taka_sats.collections SET status = 'failed', notes = COALESCE(notes,'') WHERE id = $1`, [id],
  );
  res.json({ status: 'failed', collection_ref: row.collection_ref, error: body.error ?? 'Payment failed' });
});

/** GET /taka-sats/supervisor/today */
router.get('/supervisor/today', requireRole('supervisor'), async (req, res) => {
  const id = (req as Request & { takaId: string }).takaId;
  const rows = await query(
    `SELECT c.collection_ref, col.name AS collector, c.material_type, c.weight_kg,
            c.collector_sats, c.supervisor_sats, c.status, c.verified_at
     FROM taka_sats.collections c JOIN taka_sats.collectors col ON col.id = c.collector_id
     WHERE c.supervisor_id = $1 AND date_trunc('day', c.verified_at) = CURRENT_DATE
     ORDER BY c.verified_at DESC`,
    [id],
  );
  const totals = await queryOne<{ weight: string; sats: string }>(
    `SELECT COALESCE(SUM(weight_kg),0) AS weight, COALESCE(SUM(total_sats),0) AS sats
     FROM taka_sats.collections
     WHERE supervisor_id = $1 AND status = 'completed' AND date_trunc('day', verified_at) = CURRENT_DATE`,
    [id],
  );
  res.json({ collections: rows, total_weight_kg: parseFloat(totals?.weight ?? '0'), total_sats: parseInt(totals?.sats ?? '0', 10) });
});

/** GET /taka-sats/supervisor/earnings */
router.get('/supervisor/earnings', requireRole('supervisor'), async (req, res) => {
  const id = (req as Request & { takaId: string }).takaId;
  const row = await queryOne<{ today: string; week: string; month: string; all: string }>(
    `SELECT
       COALESCE(SUM(supervisor_sats) FILTER (WHERE date_trunc('day', verified_at) = CURRENT_DATE),0) AS today,
       COALESCE(SUM(supervisor_sats) FILTER (WHERE verified_at >= date_trunc('week', NOW())),0) AS week,
       COALESCE(SUM(supervisor_sats) FILTER (WHERE date_trunc('month', verified_at) = date_trunc('month', NOW())),0) AS month,
       COALESCE(SUM(supervisor_sats),0) AS all
     FROM taka_sats.collections WHERE supervisor_id = $1 AND status = 'completed'`,
    [id],
  );
  res.json({
    today_sats: parseInt(row?.today ?? '0', 10),
    week_sats: parseInt(row?.week ?? '0', 10),
    month_sats: parseInt(row?.month ?? '0', 10),
    all_time_sats: parseInt(row?.all ?? '0', 10),
  });
});

// ─── Admin ───────────────────────────────────────────────────────────────────

async function nextDisplayId(): Promise<string> {
  const row = await queryOne<{ max: string | null }>(
    `SELECT MAX(CAST(regexp_replace(display_id, '\\D', '', 'g') AS INTEGER)) AS max
     FROM taka_sats.collectors WHERE display_id ~ '[0-9]'`,
  );
  const next = (row?.max ? parseInt(row.max, 10) : 0) + 1;
  return `TS-${String(next).padStart(3, '0')}`;
}

/** GET /taka-sats/admin/overview */
router.get('/admin/overview', requireAdmin, async (_req, res) => {
  const counts = await queryOne<{ supervisors: string; collectors: string }>(
    `SELECT
       (SELECT COUNT(*) FROM taka_sats.supervisors WHERE active = TRUE) AS supervisors,
       (SELECT COUNT(*) FROM taka_sats.collectors WHERE status = 'active') AS collectors`,
  );
  const fees = await queryOne<{ accrued: string; settled: string }>(
    `SELECT
       COALESCE(SUM(supervisor_sats) FILTER (WHERE status='completed'),0) AS accrued,
       0 AS settled
     FROM taka_sats.collections`,
  );
  const agg = await queryOne<{
    today_count: string; today_weight: string; today_sats: string;
    month_count: string; month_weight: string; month_sats: string;
    total_count: string; total_weight: string; total_sats: string;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE date_trunc('day', verified_at) = CURRENT_DATE) AS today_count,
       COALESCE(SUM(weight_kg) FILTER (WHERE date_trunc('day', verified_at) = CURRENT_DATE),0) AS today_weight,
       COALESCE(SUM(total_sats) FILTER (WHERE status='completed' AND date_trunc('day', verified_at) = CURRENT_DATE),0) AS today_sats,
       COUNT(*) FILTER (WHERE date_trunc('month', verified_at) = date_trunc('month', NOW())) AS month_count,
       COALESCE(SUM(weight_kg) FILTER (WHERE date_trunc('month', verified_at) = date_trunc('month', NOW())),0) AS month_weight,
       COALESCE(SUM(total_sats) FILTER (WHERE status='completed' AND date_trunc('month', verified_at) = date_trunc('month', NOW())),0) AS month_sats,
       COUNT(*) AS total_count,
       COALESCE(SUM(weight_kg),0) AS total_weight,
       COALESCE(SUM(total_sats) FILTER (WHERE status='completed'),0) AS total_sats
     FROM taka_sats.collections`,
  );
  res.json({
    payment_mode: 'fedi-webln',
    supervisor_fees_accrued_sats: parseInt(fees?.accrued ?? '0', 10),
    active_supervisors: parseInt(counts?.supervisors ?? '0', 10),
    active_collectors: parseInt(counts?.collectors ?? '0', 10),
    today: { collections: parseInt(agg?.today_count ?? '0', 10), weight_kg: parseFloat(agg?.today_weight ?? '0'), sats: parseInt(agg?.today_sats ?? '0', 10) },
    month: { collections: parseInt(agg?.month_count ?? '0', 10), weight_kg: parseFloat(agg?.month_weight ?? '0'), sats: parseInt(agg?.month_sats ?? '0', 10) },
    all_time: { collections: parseInt(agg?.total_count ?? '0', 10), weight_kg: parseFloat(agg?.total_weight ?? '0'), sats: parseInt(agg?.total_sats ?? '0', 10) },
  });
});

/** GET /taka-sats/admin/collections — filter + paginate, ?format=csv to export */
router.get('/admin/collections', requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 500);
  const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);
  const where: string[] = [];
  const params: unknown[] = [];
  if (req.query.status) { params.push(String(req.query.status)); where.push(`c.status = $${params.length}`); }
  if (req.query.material) { params.push(String(req.query.material)); where.push(`c.material_type = $${params.length}`); }
  if (req.query.supervisor_id) { params.push(String(req.query.supervisor_id)); where.push(`c.supervisor_id = $${params.length}`); }
  if (req.query.collector_id) { params.push(String(req.query.collector_id)); where.push(`c.collector_id = $${params.length}`); }
  if (req.query.from) { params.push(String(req.query.from)); where.push(`c.verified_at >= $${params.length}`); }
  if (req.query.to) { params.push(String(req.query.to)); where.push(`c.verified_at <= $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const isCsv = req.query.format === 'csv';
  const rowLimit = isCsv ? 10000 : limit;
  params.push(rowLimit, offset);
  const rows = await query<{
    collection_ref: string; collector: string; supervisor: string; collection_point: string;
    material_type: string; weight_kg: string; kes_rate_per_kg: string; collector_sats: number;
    supervisor_sats: number; total_sats: number; status: string; verified_at: Date;
  }>(
    `SELECT c.collection_ref, col.name AS collector, sup.display_name AS supervisor,
            c.collection_point, c.material_type, c.weight_kg, c.kes_rate_per_kg,
            c.collector_sats, c.supervisor_sats, c.total_sats, c.status, c.verified_at
     FROM taka_sats.collections c
     JOIN taka_sats.collectors col ON col.id = c.collector_id
     JOIN taka_sats.supervisors sup ON sup.id = c.supervisor_id
     ${whereSql}
     ORDER BY c.verified_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  if (isCsv) {
    const header = 'collection_ref,collector,supervisor,collection_point,material_type,weight_kg,kes_rate_per_kg,collector_sats,supervisor_sats,total_sats,status,verified_at';
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((r) => [
      r.collection_ref, r.collector, r.supervisor, r.collection_point, r.material_type,
      r.weight_kg, r.kes_rate_per_kg, r.collector_sats, r.supervisor_sats, r.total_sats,
      r.status, new Date(r.verified_at).toISOString(),
    ].map(esc).join(','));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="taka-sats-collections.csv"`);
    res.send([header, ...lines].join('\n'));
    return;
  }
  const totalRow = await queryOne<{ c: string }>(
    `SELECT COUNT(*) AS c FROM taka_sats.collections c ${whereSql}`,
    params.slice(0, params.length - 2),
  );
  res.json({ collections: rows, total: parseInt(totalRow?.c ?? '0', 10), limit, offset });
});

/** GET /taka-sats/admin/report?month=YYYY-MM */
router.get('/admin/report', requireAdmin, async (req, res) => {
  const month = String(req.query.month ?? new Date().toISOString().slice(0, 7));
  const byMaterial = await query(
    `SELECT material_type, COUNT(*) AS collections,
            COALESCE(SUM(weight_kg),0) AS weight_kg,
            COALESCE(SUM(total_sats) FILTER (WHERE status='completed'),0) AS sats
     FROM taka_sats.collections
     WHERE to_char(verified_at, 'YYYY-MM') = $1
     GROUP BY material_type ORDER BY material_type`,
    [month],
  );
  const bySupervisor = await query(
    `SELECT sup.display_name AS supervisor, COUNT(*) AS collections,
            COALESCE(SUM(c.weight_kg),0) AS weight_kg,
            COALESCE(SUM(c.supervisor_sats) FILTER (WHERE c.status='completed'),0) AS fee_sats
     FROM taka_sats.collections c JOIN taka_sats.supervisors sup ON sup.id = c.supervisor_id
     WHERE to_char(c.verified_at, 'YYYY-MM') = $1
     GROUP BY sup.display_name ORDER BY collections DESC`,
    [month],
  );
  res.json({ month, by_material: byMaterial, by_supervisor: bySupervisor });
});

// ─── Admin: supervisors ──────────────────────────────────────────────────────

const SupervisorSchema = z.object({
  display_name: z.string().min(1).max(100),
  fedi_member_key: z.string().max(255).optional(),
  fedi_wallet_address: z.string().max(255).optional(),
  assigned_points: z.array(z.string()).optional(),
  community_id: z.string().uuid().optional(),
});

router.get('/admin/supervisors', requireAdmin, async (_req, res) => {
  const rows = await query(
    `SELECT s.id, s.display_name, s.fedi_member_key, s.fedi_wallet_address,
            s.assigned_points, s.active, s.registered_at,
            (SELECT COUNT(*) FROM taka_sats.collections c WHERE c.supervisor_id = s.id) AS collections
     FROM taka_sats.supervisors s ORDER BY s.registered_at DESC`,
  );
  res.json({ supervisors: rows });
});

router.post('/admin/supervisors', requireAdmin, async (req, res) => {
  let data: z.infer<typeof SupervisorSchema>;
  try { data = SupervisorSchema.parse(req.body); }
  catch (err) { res.status(400).json({ error: err instanceof z.ZodError ? err.errors : 'Invalid request' }); return; }
  const id = randomUUID();
  await query(
    `INSERT INTO taka_sats.supervisors (id, display_name, fedi_member_key, fedi_wallet_address, assigned_points, community_id)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, data.display_name, data.fedi_member_key ?? null, data.fedi_wallet_address ?? null,
     data.assigned_points ?? [], data.community_id ?? null],
  );
  res.status(201).json({ id, display_name: data.display_name });
});

router.patch('/admin/supervisors/:id', requireAdmin, async (req, res) => {
  const fields: string[] = [];
  const params: unknown[] = [];
  const b = req.body ?? {};
  if (typeof b.display_name === 'string') { params.push(b.display_name); fields.push(`display_name = $${params.length}`); }
  if (typeof b.fedi_wallet_address === 'string') { params.push(b.fedi_wallet_address); fields.push(`fedi_wallet_address = $${params.length}`); }
  if (typeof b.fedi_member_key === 'string') { params.push(b.fedi_member_key); fields.push(`fedi_member_key = $${params.length}`); }
  if (Array.isArray(b.assigned_points)) { params.push(b.assigned_points); fields.push(`assigned_points = $${params.length}`); }
  if (typeof b.active === 'boolean') { params.push(b.active); fields.push(`active = $${params.length}`); }
  if (!fields.length) { res.status(400).json({ error: 'No fields to update' }); return; }
  params.push(req.params.id);
  const row = await queryOne<{ id: string }>(
    `UPDATE taka_sats.supervisors SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id`, params,
  );
  if (!row) { res.status(404).json({ error: 'Supervisor not found' }); return; }
  res.json({ id: row.id, updated: true });
});

// ─── Admin: collectors ───────────────────────────────────────────────────────

const CollectorSchema = z.object({
  name: z.string().min(1).max(100),
  wallet_address: z.string().max(255).optional(),
  wallet_type: z.enum(['fedi', 'blink', 'machankura']).optional(),
  community_id: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

router.get('/admin/collectors', requireAdmin, async (_req, res) => {
  const rows = await query(
    `SELECT c.id, c.display_id, c.name, c.wallet_address, c.wallet_type, c.status, c.registered_at,
            (SELECT COUNT(*) FROM taka_sats.collections col WHERE col.collector_id = c.id) AS collections,
            (SELECT COALESCE(SUM(collector_sats),0) FROM taka_sats.collections col WHERE col.collector_id = c.id AND col.status='completed') AS earned_sats
     FROM taka_sats.collectors c ORDER BY c.registered_at DESC`,
  );
  res.json({ collectors: rows });
});

router.post('/admin/collectors', requireAdmin, async (req, res) => {
  let data: z.infer<typeof CollectorSchema>;
  try { data = CollectorSchema.parse(req.body); }
  catch (err) { res.status(400).json({ error: err instanceof z.ZodError ? err.errors : 'Invalid request' }); return; }
  const id = randomUUID();
  const displayId = await nextDisplayId();
  const qrSecret = randomBytes(32).toString('hex');
  await query(
    `INSERT INTO taka_sats.collectors (id, display_id, name, wallet_address, wallet_type, qr_secret, community_id, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, displayId, data.name, data.wallet_address ?? null, data.wallet_type ?? 'fedi', qrSecret,
     data.community_id ?? null, data.notes ?? null],
  );
  res.status(201).json({ id, display_id: displayId, name: data.name, qr_url: qrUrl(displayId, qrSecret) });
});

router.patch('/admin/collectors/:id', requireAdmin, async (req, res) => {
  const b = req.body ?? {};
  if (b.regenerate_qr === true) {
    const qrSecret = randomBytes(32).toString('hex');
    const row = await queryOne<{ display_id: string }>(
      `UPDATE taka_sats.collectors SET qr_secret = $1 WHERE id = $2 RETURNING display_id`, [qrSecret, req.params.id],
    );
    if (!row) { res.status(404).json({ error: 'Collector not found' }); return; }
    res.json({ id: req.params.id, qr_url: qrUrl(row.display_id, qrSecret), regenerated: true });
    return;
  }
  const fields: string[] = [];
  const params: unknown[] = [];
  if (typeof b.name === 'string') { params.push(b.name); fields.push(`name = $${params.length}`); }
  if (typeof b.wallet_address === 'string') { params.push(b.wallet_address); fields.push(`wallet_address = $${params.length}`); }
  if (typeof b.wallet_type === 'string') { params.push(b.wallet_type); fields.push(`wallet_type = $${params.length}`); }
  if (typeof b.status === 'string') { params.push(b.status); fields.push(`status = $${params.length}`); }
  if (typeof b.notes === 'string') { params.push(b.notes); fields.push(`notes = $${params.length}`); }
  if (!fields.length) { res.status(400).json({ error: 'No fields to update' }); return; }
  params.push(req.params.id);
  const row = await queryOne<{ id: string }>(
    `UPDATE taka_sats.collectors SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id`, params,
  );
  if (!row) { res.status(404).json({ error: 'Collector not found' }); return; }
  res.json({ id: row.id, updated: true });
});

// ─── Admin: settlements ──────────────────────────────────────────────────────

router.get('/admin/settlements', requireAdmin, async (_req, res) => {
  const perSupervisor = await query(
    `SELECT s.id AS supervisor_id, s.display_name,
            COALESCE(SUM(c.supervisor_sats) FILTER (WHERE c.status='completed'),0) AS fees_accrued_sats,
            COUNT(c.id) FILTER (WHERE c.status='completed') AS completed_collections
     FROM taka_sats.supervisors s
     LEFT JOIN taka_sats.collections c ON c.supervisor_id = s.id
     GROUP BY s.id, s.display_name
     ORDER BY fees_accrued_sats DESC`,
  );
  const recent = await query(
    `SELECT c.collection_ref, col.name AS collector, c.collector_sats, c.supervisor_sats,
            c.total_sats, c.collector_tx_id, c.paid_at
     FROM taka_sats.collections c
     JOIN taka_sats.collectors col ON col.id = c.collector_id
     WHERE c.status='completed'
     ORDER BY c.paid_at DESC NULLS LAST LIMIT 50`,
  );
  const totals = await queryOne<{ accrued: string; paid_out: string }>(
    `SELECT
       COALESCE(SUM(supervisor_sats) FILTER (WHERE status='completed'),0) AS accrued,
       COALESCE(SUM(collector_sats) FILTER (WHERE status='completed'),0) AS paid_out
     FROM taka_sats.collections`,
  );
  res.json({
    payment_mode: 'fedi-webln',
    supervisor_fees_accrued_sats: parseInt(totals?.accrued ?? '0', 10),
    collector_paid_out_sats: parseInt(totals?.paid_out ?? '0', 10),
    per_supervisor: perSupervisor,
    recent_payouts: recent,
  });
});

// ─── Admin: rates ────────────────────────────────────────────────────────────

const RateSchema = z.object({
  material_type: z.enum(['plastic', 'metal', 'paper', 'mixed', 'other']),
  kes_per_kg: z.number().positive().max(100000),
});

router.get('/admin/rates', requireAdmin, async (_req, res) => {
  const rows = await query(
    `SELECT id, material_type, kes_per_kg, effective_from
     FROM taka_sats.payout_rates WHERE effective_to IS NULL ORDER BY material_type`,
  );
  res.json({ rates: rows });
});

router.post('/admin/rates', requireAdmin, async (req, res) => {
  let data: z.infer<typeof RateSchema>;
  try { data = RateSchema.parse(req.body); }
  catch (err) { res.status(400).json({ error: err instanceof z.ZodError ? err.errors : 'Invalid request' }); return; }
  await withTransaction(async (tx) => {
    await tx.query(
      `UPDATE taka_sats.payout_rates SET effective_to = CURRENT_DATE
       WHERE material_type = $1 AND effective_to IS NULL`, [data.material_type],
    );
    await tx.query(
      `INSERT INTO taka_sats.payout_rates (id, material_type, kes_per_kg) VALUES ($1,$2,$3)`,
      [randomUUID(), data.material_type, data.kes_per_kg],
    );
  });
  res.status(201).json({ material_type: data.material_type, kes_per_kg: data.kes_per_kg });
});

export default router;
