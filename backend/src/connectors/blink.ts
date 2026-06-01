import { z } from 'zod';

// ─── Blink GraphQL response shapes ───────────────────────────────────────────

const BlinkTransactionSchema = z.object({
  id: z.string(),
  direction: z.enum(['RECEIVE', 'SEND']),
  status: z.string(),
  memo: z.string().nullable().optional(),
  createdAt: z.number(),
  settlementAmount: z.number(),
  settlementFee: z.number().optional().default(0),
  settlementCurrency: z.string().optional(),
  initiationVia: z.object({
    paymentHash: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  settlementVia: z.record(z.unknown()).optional(),
});

const BlinkWalletSchema = z.object({
  id: z.string(),
  balance: z.number(),
  walletCurrency: z.string(),
  transactions: z.object({
    edges: z.array(z.object({
      node: BlinkTransactionSchema,
    })),
    pageInfo: z.object({
      hasNextPage: z.boolean(),
      endCursor: z.string().nullable().optional(),
    }),
  }),
});

// ─── Normalised internal types ────────────────────────────────────────────────

export type NormalisedTransaction = {
  externalId: string;
  direction: 'in' | 'out';
  amountSats: number;
  feeSats: number;
  memo: string | null;
  occurredAt: Date;
  raw: Record<string, unknown>;
};

export type BlinkWalletData = {
  walletId: string;
  balanceSats: number;
  currency: string;
  transactions: NormalisedTransaction[];
  hasMore: boolean;
  endCursor: string | null;
};

// ─── GraphQL queries ──────────────────────────────────────────────────────────

const BALANCE_AND_TXN_QUERY = /* graphql */ `
  query MeBalanceAndTxns($first: Int!, $after: String) {
    me {
      defaultAccount {
        wallets {
          id
          balance
          walletCurrency
          transactions(first: $first, after: $after) {
            edges {
              node {
                id
                direction
                status
                memo
                createdAt
                settlementAmount
                settlementFee
                settlementCurrency
                initiationVia {
                  ... on InitiationViaLn  { paymentHash }
                  ... on InitiationViaOnChain { address }
                  ... on InitiationViaIntraLedger { counterPartyUsername }
                }
                settlementVia {
                  ... on SettlementViaLn  { preImage }
                  ... on SettlementViaOnChain { transactionHash }
                  ... on SettlementViaIntraLedger { counterPartyUsername }
                }
              }
            }
            pageInfo { hasNextPage endCursor }
          }
        }
      }
    }
  }
`;

const BLINK_API = 'https://api.blink.sv/graphql';

// ─── Connector ────────────────────────────────────────────────────────────────

export class BlinkConnector {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** Validate key format before making any network call */
  static validateKeyFormat(key: string): boolean {
    return /^blink_[A-Za-z0-9_\-]{20,}$/.test(key.trim());
  }

  private async gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const res = await fetch(BLINK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 401) throw new BlinkError('Invalid API key. Check your Blink read-only key.', 401);
    if (res.status === 429) throw new BlinkError('Rate limited by Blink. Please wait a moment.', 429);
    if (!res.ok) throw new BlinkError(`Blink API error: ${res.status}`, res.status);

    const body = (await res.json()) as { data?: T; errors?: { message: string }[] };

    if (body.errors?.length) {
      throw new BlinkError(`Blink API: ${body.errors[0].message}`, 400);
    }

    if (!body.data) throw new BlinkError('Blink API returned no data', 500);
    return body.data;
  }

  /** Fetch balance + first page of transactions */
  async fetchWalletData(first = 50, after?: string): Promise<BlinkWalletData[]> {
    const data = await this.gql<{
      me: { defaultAccount: { wallets: unknown[] } };
    }>(BALANCE_AND_TXN_QUERY, { first, after: after ?? null });

    const rawWallets = data.me.defaultAccount.wallets;
    const results: BlinkWalletData[] = [];

    for (const raw of rawWallets) {
      const wallet = BlinkWalletSchema.parse(raw);

      // Blink returns amounts in sats for BTC wallets
      const balanceSats = wallet.walletCurrency === 'BTC'
        ? wallet.balance
        : 0; // skip USD stablesats in Phase 1

      const txns: NormalisedTransaction[] = wallet.transactions.edges.map(({ node: t }) => ({
        externalId: t.id,
        direction: t.direction === 'RECEIVE' ? 'in' : 'out',
        amountSats: Math.abs(t.settlementAmount),
        feeSats: Math.abs(t.settlementFee ?? 0),
        memo: sanitiseMemo(t.memo ?? null),
        occurredAt: new Date(t.createdAt * 1000),
        raw: t as Record<string, unknown>,
      }));

      results.push({
        walletId: wallet.id,
        balanceSats,
        currency: wallet.walletCurrency,
        transactions: txns,
        hasMore: wallet.transactions.pageInfo.hasNextPage,
        endCursor: wallet.transactions.pageInfo.endCursor ?? null,
      });
    }

    return results.filter((w) => w.currency === 'BTC');
  }

  /** Paginate through ALL historical transactions */
  async fetchAllTransactions(progressCb?: (count: number) => void): Promise<NormalisedTransaction[]> {
    const all: NormalisedTransaction[] = [];
    let after: string | undefined;
    let page = 0;

    while (true) {
      page++;
      const wallets = await this.fetchWalletData(100, after);
      if (!wallets.length) break;

      const wallet = wallets[0];
      all.push(...wallet.transactions);
      progressCb?.(all.length);

      if (!wallet.hasMore || !wallet.endCursor) break;
      after = wallet.endCursor;

      // Respect rate limits — small delay between pages
      if (page > 1) await sleep(500);
    }

    return all;
  }
}

// ─── Custom error ─────────────────────────────────────────────────────────────

export class BlinkError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'BlinkError';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip any prompt-injection patterns from transaction memos before they
 * can reach the AI system prompt. Memos are user/counterparty controlled.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)/i,
  /you\s+are\s+now/i,
  /act\s+as/i,
  /system\s*:/i,
  /<\s*\/?\s*(system|instruction)/i,
  /\[\s*INST\s*\]/i,
];

function sanitiseMemo(memo: string | null): string | null {
  if (!memo) return null;
  for (const p of INJECTION_PATTERNS) {
    if (p.test(memo)) return '[memo redacted]';
  }
  return memo.slice(0, 200);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
