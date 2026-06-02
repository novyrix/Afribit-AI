import type {
  SATSConnector,
  ConnectorAuth,
  WalletBalance,
  Transaction,
  GetTransactionsOptions,
} from '../../spec';
import { BlinkConnector, BlinkError } from '../../blink';

// Reference implementation of the SATS Connector Interface for Blink.
// Wraps the existing read-only BlinkConnector. Read-only by mandate.

export const connector: SATSConnector = {
  async connect(auth: ConnectorAuth) {
    const apiKey = auth.apiKey?.trim();
    if (!apiKey || !BlinkConnector.validateKeyFormat(apiKey)) {
      return { success: false, error: 'Invalid Blink API key format. Keys must start with "blink_".' };
    }
    try {
      await new BlinkConnector(apiKey).fetchWalletData(1);
      return { success: true };
    } catch (err) {
      const msg = err instanceof BlinkError ? err.message : 'Failed to reach Blink.';
      return { success: false, error: msg };
    }
  },

  async getBalances(auth: ConnectorAuth): Promise<WalletBalance[]> {
    const apiKey = auth.apiKey?.trim();
    if (!apiKey) throw new Error('Missing Blink API key.');
    const wallets = await new BlinkConnector(apiKey).fetchWalletData(1);
    const now = Date.now();
    return wallets.map((w) => ({
      walletId: w.walletId,
      sats: w.balanceSats,
      currency: w.currency,
      walletLabel: `Blink ${w.currency}`,
      lastUpdated: now,
    }));
  },

  async getTransactions(auth: ConnectorAuth, options: GetTransactionsOptions): Promise<Transaction[]> {
    const apiKey = auth.apiKey?.trim();
    if (!apiKey) throw new Error('Missing Blink API key.');
    const limit = options.limit ?? 50;
    const wallets = await new BlinkConnector(apiKey).fetchWalletData(limit);
    const out: Transaction[] = [];
    for (const w of wallets) {
      for (const t of w.transactions) {
        out.push({
          id: t.externalId,
          direction: t.direction === 'in' ? 'incoming' : 'outgoing',
          amountSats: t.amountSats,
          currency: w.currency,
          memo: t.memo ?? undefined,
          createdAt: t.occurredAt.getTime(),
          status: 'settled',
          network: 'lightning',
          walletId: w.walletId,
        });
      }
    }
    return out.slice(0, limit);
  },

  async ping(auth: ConnectorAuth): Promise<boolean> {
    const apiKey = auth.apiKey?.trim();
    if (!apiKey || !BlinkConnector.validateKeyFormat(apiKey)) return false;
    try {
      await new BlinkConnector(apiKey).fetchWalletData(1);
      return true;
    } catch {
      return false;
    }
  },
};
