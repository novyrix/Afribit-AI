import { Router } from 'express';
import { pool } from '../db/client';
import { getCurrentRate } from '../connectors/coingecko';

const router = Router();

router.get('/', async (_req, res) => {
  const checks: Record<string, string> = {};

  // DB check
  try {
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Rate cache check
  try {
    const rate = await getCurrentRate();
    checks.rateCache = rate.isStale ? 'stale' : 'ok';
    checks.kesPerBtc = String(Math.round(rate.kesPerBtc));
  } catch {
    checks.rateCache = 'error';
  }

  const statusChecks = ['database', 'rateCache'];
  const allOk = statusChecks.every((k) => checks[k] === 'ok');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
