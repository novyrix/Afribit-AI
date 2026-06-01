import { Router } from 'express';
import { getCurrentRate, getHistoricalRates } from '../connectors/coingecko';

const router = Router();

/** GET /rates/current — current BTC/KES rate */
router.get('/current', async (_req, res) => {
  try {
    const rate = await getCurrentRate();
    res.json({
      kesPerBtc: Math.round(rate.kesPerBtc),
      fetchedAt: rate.fetchedAt,
      isStale: rate.isStale,
      source: rate.source,
    });
  } catch (err) {
    res.status(503).json({ error: (err as Error).message });
  }
});

/** GET /rates/history?days=30 — historical daily rates */
router.get('/history', async (req, res) => {
  try {
    const days = Math.min(parseInt(String(req.query.days ?? 30), 10), 90);
    const history = await getHistoricalRates(days);
    res.json(
      history.map((h) => ({
        date: h.date.toISOString().split('T')[0],
        kesPerBtc: Math.round(h.kesPerBtc),
      }))
    );
  } catch (err) {
    res.status(503).json({ error: (err as Error).message });
  }
});

export default router;
