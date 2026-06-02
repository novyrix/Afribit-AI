import type {
  SATSConnector,
  ConnectorAuth,
  ConnectorManifest,
  WalletBalance,
} from '../spec';

import blinkManifest from './blink-wallet/connector.json';
import { connector as blinkConnector } from './blink-wallet';
import fediAfribitManifest from './fedimint-afribit/connector.json';
import { connector as fediAfribitConnector } from './fedimint-afribit';
import fediGenericManifest from './fedimint-generic/connector.json';
import { connector as fediGenericConnector } from './fedimint-generic';

interface RegistryEntry {
  manifest: ConnectorManifest;
  connector: SATSConnector;
}

// Static registry. The spec's runtime `import('../../connectors/${id}/index.ts')`
// does not survive TypeScript compilation to dist/, so connectors are wired in
// explicitly here. Adding a connector is a one-line change in this map.
const REGISTRY: Record<string, RegistryEntry> = {
  'blink-wallet': {
    manifest: blinkManifest as ConnectorManifest,
    connector: blinkConnector,
  },
  'fedimint-afribit': {
    manifest: fediAfribitManifest as ConnectorManifest,
    connector: fediAfribitConnector,
  },
  'fedimint-generic': {
    manifest: fediGenericManifest as ConnectorManifest,
    connector: fediGenericConnector,
  },
};

export function listManifests(): ConnectorManifest[] {
  return Object.values(REGISTRY).map((e) => e.manifest);
}

export function getManifest(connectorId: string): ConnectorManifest | null {
  return REGISTRY[connectorId]?.manifest ?? null;
}

export function loadConnector(connectorId: string): SATSConnector | null {
  return REGISTRY[connectorId]?.connector ?? null;
}

export function hasConnector(connectorId: string): boolean {
  return connectorId in REGISTRY;
}

export interface UserConnection {
  connectorId: string;
  auth: ConnectorAuth;
}

// Unified balance fetch across every connected connector. A failure in one
// connector never blocks the others.
export async function getAllBalances(
  userConnections: UserConnection[],
): Promise<WalletBalance[]> {
  const results = await Promise.allSettled(
    userConnections.map(async ({ connectorId, auth }) => {
      const connector = loadConnector(connectorId);
      if (!connector) throw new Error(`Unknown connector: ${connectorId}`);
      return connector.getBalances(auth);
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<WalletBalance[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
}
