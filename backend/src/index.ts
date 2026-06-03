import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { globalLimiter, takaSatsLimiter } from './middleware/rateLimit';

import sessionRouter      from './routes/session';
import walletsRouter      from './routes/wallets';
import aiRouter           from './routes/ai';
import ratesRouter        from './routes/rates';
import transactionsRouter from './routes/transactions';
import connectorsRouter   from './routes/connectors';
import { startHealthMonitor } from './connectors/health';
import healthRouter       from './routes/health';
import webhooksRouter     from './routes/webhooks';
import inflationRouter    from './routes/inflation';
import takaSatsRouter     from './routes/taka-sats';

const app = express();

// Trust the first proxy hop (Cloudflare / Nginx / Tailscale ingress).
// This makes req.ip resolve to the real client IP from X-Forwarded-For
// so rate-limit buckets are per-user, not per-proxy.
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.blink.sv', 'https://api.coingecko.com', 'https://openrouter.ai'],
    },
  },
}));

// ── CORS — Vercel + afribit.africa frontends + local dev ──────────────────────
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = [config.cors.origin, 'http://localhost:5173', 'http://localhost:3000'];
    if (allowed.includes(origin)) return cb(null, true);
    if (/^https:\/\/([a-z0-9-]+\.)?afribit\.africa$/i.test(origin)) return cb(null, true);
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/health',       healthRouter);
app.use('/webhooks',     webhooksRouter);  // No JWT — Svix signature auth
app.use('/session',      sessionRouter);
app.use('/wallets',      walletsRouter);
app.use('/ai',           aiRouter);
app.use('/rates',        ratesRouter);
app.use('/transactions', transactionsRouter);
app.use('/connectors',   connectorsRouter);  // Public connector directory
  app.use('/inflation',    inflationRouter);
  app.use('/taka-sats',    takaSatsLimiter, takaSatsRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[unhandled]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`[sats] Afribit SATS backend running on port ${config.port}`);
  console.log(`[sats] Environment: ${config.nodeEnv}`);
  console.log(`[sats] CORS origin: ${config.cors.origin}`);
  console.log(`[sats] AI routing: fast=${config.openrouter.models.fast} mid=${config.openrouter.models.mid} heavy=${config.openrouter.models.heavy}`);
  startHealthMonitor();
});

export default app;
