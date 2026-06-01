import { Router } from 'express';
import { z } from 'zod';
import { requireSession } from '../middleware/auth';
import { query } from '../db/client';
import { getCurrentRate, satsToKes } from '../connectors/coingecko';

const router = Router();

const ListSchema = z.object({
  wallet: z.string().uuid().optional(),
  direction: z.enum(['in', 'out', 'all']).default('all'),
  category: z.string().optional(),
  since: z.string().optional(),   // ISO date
  until: z.string().optional(),   // ISO date
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/** GET /transactions — paginated unified transaction feed */
router.get('/', requireSession, async (req, res) => {
  try {
    const params = ListSchema.parse(req.query);
    const dir = params.direction !== 'all' ? params.direction : null;

    const rows = await query<{
      id: string; external_id: string; direction: string;
      amount_sats: string; fee_sats: string; category: string;
      memo: string | null; occurred_at: Date; kes_rate_at_time: string | null;
      wallet_id: string; wallet_nickname: string; wallet_type: string;
    }>(
      `SELECT t.id, t.external_id, t.direction, t.amount_sats, t.fee_sats,
              t.category, t.memo, t.occurred_at, t.kes_rate_at_time,
              wc.id as wallet_id, wc.nickname as wallet_nickname, wc.wallet_type
       FROM transactions_cache t
       JOIN wallet_connections wc ON wc.id = t.wallet_conn_id
       WHERE t.session_id = $1
         AND ($2::uuid IS NULL OR wc.id = $2)
         AND ($3::text IS NULL OR t.direction = $3)
         AND ($4::text IS NULL OR t.category = $4)
         AND ($5::timestamptz IS NULL OR t.occurred_at >= $5::timestamptz)
         AND ($6::timestamptz IS NULL OR t.occurred_at <= $6::timestamptz)
       ORDER BY t.occurred_at DESC
       LIMIT $7 OFFSET $8`,
      [
        req.sessionId,
        params.wallet ?? null,
        dir,
        params.category ?? null,
        params.since ?? null,
        params.until ?? null,
        params.limit,
        params.offset,
      ]
    );

    const rate = await getCurrentRate();

    const txns = rows.map((r) => {
      const sats = parseInt(r.amount_sats, 10);
      return {
        id: r.id,
        externalId: r.external_id,
        direction: r.direction,
        amountSats: sats,
        amountKes: Math.round(satsToKes(sats, rate.kesPerBtc)),
        feeSats: parseInt(r.fee_sats, 10),
        category: r.category,
        memo: r.memo,
        occurredAt: r.occurred_at,
        wallet: { id: r.wallet_id, nickname: r.wallet_nickname, type: r.wallet_type },
      };
    });

    res.json({ transactions: txns, count: txns.length, kesPerBtc: Math.round(rate.kesPerBtc) });
  } catch (err) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/** GET /transactions/summary — aggregate stats for dashboard */
router.get('/summary', requireSession, async (req, res) => {
  try {
    const days = Math.min(parseInt(String(req.query.days ?? 30), 10), 365);
    const rate = await getCurrentRate();

    const rows = await query<{
      direction: string; total_sats: string; tx_count: string;
    }>(
      `SELECT t.direction, SUM(t.amount_sats) as total_sats, COUNT(*) as tx_count
       FROM transactions_cache t
       JOIN wallet_connections wc ON wc.id = t.wallet_conn_id
       WHERE t.session_id = $1
         AND t.occurred_at >= NOW() - INTERVAL '1 day' * $2
         AND wc.is_active = TRUE
       GROUP BY t.direction`,
      [req.sessionId, days]
    );

    const inc = rows.find((r) => r.direction === 'in');
    const out = rows.find((r) => r.direction === 'out');
    const inSats  = parseInt(inc?.total_sats ?? '0', 10);
    const outSats = parseInt(out?.total_sats ?? '0', 10);

    res.json({
      period: `${days}d`,
      incoming: { sats: inSats, kes: Math.round(satsToKes(inSats, rate.kesPerBtc)), count: parseInt(inc?.tx_count ?? '0', 10) },
      outgoing: { sats: outSats, kes: Math.round(satsToKes(outSats, rate.kesPerBtc)), count: parseInt(out?.tx_count ?? '0', 10) },
      net: { sats: inSats - outSats, kes: Math.round(satsToKes(inSats - outSats, rate.kesPerBtc)) },
      kesPerBtc: Math.round(rate.kesPerBtc),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;
