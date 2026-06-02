import { Router } from 'express';
import { listManifests, getManifest, loadConnector } from '../connectors/registry';
import type { ConnectorAuth, AuthType } from '../connectors/spec';

const router = Router();

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

