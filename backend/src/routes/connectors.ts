import { Router } from 'express';
import { z } from 'zod';
import { listManifests, getManifest, loadConnector } from '../connectors/registry';
import { getHealthSnapshot } from '../connectors/health';
import {
  sendVerificationCode,
  verifyCode,
  createSubmission,
  isEmailConfigured,
  isGithubConfigured,
  SubmissionError,
} from '../connectors/submissions';
import type { ConnectorAuth, AuthType } from '../connectors/spec';

const router = Router();

const submitSchema = z.object({
  emailToken: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  githubUsername: z.string().trim().min(1).max(80),
  organization: z.string().trim().max(120).optional(),
  repoUrl: z.string().trim().url().max(300),
  connectorId: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/, 'Use lowercase letters, numbers and hyphens.'),
  category: z.enum(['wallet', 'exchange', 'on-ramp', 'data']),
  working: z.enum(['yes', 'in_progress']),
  rationale: z.string().trim().min(10).max(2000),
  declarations: z.object({
    readOnly: z.literal(true),
    testsPass: z.literal(true),
    maintain: z.literal(true),
    terms: z.literal(true),
  }),
});

const AUTH_FIELD: Record<AuthType, keyof ConnectorAuth | null> = {
  api_key: 'apiKey',
  oauth: 'oauthToken',
  invite_code: 'inviteCode',
  nwc_uri: 'nwcUri',
  none: null,
};

interface MethodResult {
  method: string;
  ok: boolean;
  ms: number;
  error?: string;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value?: T; error?: string }> {
  const start = Date.now();
  try {
    const value = await fn();
    return { ms: Date.now() - start, value };
  } catch (err) {
    return { ms: Date.now() - start, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** GET /connectors — public connector directory */
router.get('/', (req, res) => {
  const { category, status } = req.query as { category?: string; status?: string };
  let manifests = listManifests();
  if (category) manifests = manifests.filter((m) => m.category === category);
  if (status) manifests = manifests.filter((m) => m.status === status);
  res.json({ connectors: manifests, total: manifests.length });
});

/** GET /connectors/health — public connector network health board */
router.get('/health', (_req, res) => {
  res.json({ connectors: getHealthSnapshot(), checkedAt: Date.now() });
});

/** GET /connectors/submit/config — which submission features are available */
router.get('/submit/config', (_req, res) => {
  res.json({ emailEnabled: isEmailConfigured(), githubEnabled: isGithubConfigured() });
});

/** POST /connectors/submit/email — send an email verification code */
router.post('/submit/email', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }
  try {
    await sendVerificationCode(email);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof SubmissionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('[connectors] send code failed', err instanceof Error ? err.message : err);
    res.status(502).json({ error: 'Could not send verification email. Please try again later.' });
  }
});

/** POST /connectors/submit/verify — confirm code, return an email token */
router.post('/submit/verify', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email : '';
  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  if (!email || !code) {
    res.status(400).json({ error: 'Email and code are required.' });
    return;
  }
  try {
    const emailToken = verifyCode(email, code);
    res.json({ emailToken });
  } catch (err) {
    if (err instanceof SubmissionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: 'Verification failed.' });
  }
});

/** POST /connectors/submit — create a connector submission (GitHub issue) */
router.post('/submit', async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid submission.' });
    return;
  }
  try {
    const result = await createSubmission(parsed.data);
    res.json(result);
  } catch (err) {
    if (err instanceof SubmissionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('[connectors] submission failed', err instanceof Error ? err.message : err);
    res.status(502).json({ error: 'Submission failed. Please try again later.' });
  }
});

/** GET /connectors/:id — single connector manifest */
router.get('/:id', (req, res) => {
  const manifest = getManifest(req.params.id);
  if (!manifest) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }
  res.json(manifest);
});

/**
 * POST /connectors/:id/test — playground live tester.
 * Runs connect/getBalances/getTransactions against the real connector with
 * user-supplied credentials. Credentials are used in-memory only: never
 * stored, logged, or retained after the request completes.
 */
router.post('/:id/test', async (req, res) => {
  const manifest = getManifest(req.params.id);
  const connector = loadConnector(req.params.id);
  if (!manifest || !connector) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }

  const auth: ConnectorAuth = {};
  const field = AUTH_FIELD[manifest.auth.type];
  if (field) {
    const credential = typeof req.body?.credential === 'string' ? req.body.credential.trim() : '';
    if (!credential) {
      res.status(400).json({ error: `Missing credential for ${manifest.auth.type}.` });
      return;
    }
    auth[field] = credential;
  }

  const results: MethodResult[] = [];

  const connectRun = await timed(() => connector.connect(auth));
  const connectOk = !connectRun.error && connectRun.value?.success === true;
  results.push({
    method: 'connect',
    ok: connectOk,
    ms: connectRun.ms,
    error: connectRun.error ?? (connectRun.value?.success ? undefined : connectRun.value?.error),
  });

  if (!connectOk) {
    res.json({ connector: manifest.id, results, response: null });
    return;
  }

  const balancesRun = await timed(() => connector.getBalances(auth));
  results.push({
    method: 'getBalances',
    ok: !balancesRun.error,
    ms: balancesRun.ms,
    error: balancesRun.error,
  });

  const txRun = await timed(() => connector.getTransactions(auth, { limit: 5 }));
  results.push({
    method: 'getTransactions',
    ok: !txRun.error,
    ms: txRun.ms,
    error: txRun.error,
  });

  res.json({
    connector: manifest.id,
    results,
    response: {
      balances: balancesRun.value ?? [],
      transactions: txRun.value ?? [],
    },
  });
});

export default router;

