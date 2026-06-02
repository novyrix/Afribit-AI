import { listManifests, loadConnector } from './registry';
import type { ConnectorAuth, ConnectorManifest, AuthType } from './spec';

export type HealthStatus = 'online' | 'slow' | 'offline' | 'unknown';

export interface ConnectorHealth {
  id: string;
  name: string;
  status: HealthStatus;
  latencyMs: number | null;
  uptime: number | null;
  samples: number;
  lastChecked: number | null;
}

const SLOW_THRESHOLD_MS = 1500;
const PING_TIMEOUT_MS = 8000;
const HISTORY_MAX = 288;

interface HealthRecord {
  history: boolean[];
  latencyMs: number | null;
  lastChecked: number | null;
  status: HealthStatus;
}

const store = new Map<string, HealthRecord>();

const AUTH_FIELD: Record<AuthType, keyof ConnectorAuth | null> = {
  api_key: 'apiKey',
  oauth: 'oauthToken',
  invite_code: 'inviteCode',
  nwc_uri: 'nwcUri',
  none: null,
};

function envCredential(manifest: ConnectorManifest): string | null {
  if (manifest.auth.type === 'none') return null;
  if (manifest.id === 'blink-wallet' && process.env.BLINK_API_KEY) {
    return process.env.BLINK_API_KEY;
  }
  const key = `HEALTH_CRED_${manifest.id.toUpperCase().replace(/-/g, '_')}`;
  return process.env[key] ?? null;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

function ensure(id: string): HealthRecord {
  let rec = store.get(id);
  if (!rec) {
    rec = { history: [], latencyMs: null, lastChecked: null, status: 'unknown' };
    store.set(id, rec);
  }
  return rec;
}

async function checkOne(manifest: ConnectorManifest): Promise<void> {
  const rec = ensure(manifest.id);
  const connector = loadConnector(manifest.id);

  if (!connector || typeof connector.ping !== 'function') {
    rec.status = 'unknown';
    rec.latencyMs = null;
    rec.lastChecked = Date.now();
    return;
  }

  const field = AUTH_FIELD[manifest.auth.type];
  const auth: ConnectorAuth = {};
  if (field) {
    const credential = envCredential(manifest);
    if (!credential) {
      rec.status = 'unknown';
      rec.latencyMs = null;
      rec.lastChecked = Date.now();
      return;
    }
    auth[field] = credential;
  }

  const start = Date.now();
  let up = false;
  try {
    up = await withTimeout(connector.ping(auth), PING_TIMEOUT_MS);
  } catch {
    up = false;
  }
  const latency = Date.now() - start;

  rec.history.push(up);
  if (rec.history.length > HISTORY_MAX) rec.history.shift();
  rec.latencyMs = up ? latency : null;
  rec.lastChecked = Date.now();
  rec.status = !up ? 'offline' : latency >= SLOW_THRESHOLD_MS ? 'slow' : 'online';
}

export async function runHealthChecks(): Promise<void> {
  await Promise.allSettled(listManifests().map((m) => checkOne(m)));
}

export function getHealthSnapshot(): ConnectorHealth[] {
  return listManifests().map((m) => {
    const rec = store.get(m.id);
    const samples = rec?.history.length ?? 0;
    const up = rec?.history.filter(Boolean).length ?? 0;
    return {
      id: m.id,
      name: m.name,
      status: rec?.status ?? 'unknown',
      latencyMs: rec?.latencyMs ?? null,
      uptime: samples > 0 ? up / samples : null,
      samples,
      lastChecked: rec?.lastChecked ?? null,
    };
  });
}

export function startHealthMonitor(intervalMs = 5 * 60 * 1000): void {
  void runHealthChecks();
  setInterval(() => void runHealthChecks(), intervalMs).unref();
}
