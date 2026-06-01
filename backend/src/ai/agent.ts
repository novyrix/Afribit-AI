import { openrouterChat, type Message } from './openrouter';
import { routeMessage } from './router';
import { PHASE1_TOOLS, isToolCallSafe } from './tools';
import { buildSystemPrompt, compressHistory, type Language } from './prompts';
import { getCurrentRate, getHistoricalRates, satsToKes } from '../connectors/coingecko';
import { query } from '../db/client';

export type WalletSummary = {
  walletConnId: string;
  nickname: string;
  walletType: string;
  balanceSats: number;
};

export type AgentInput = {
  sessionId: string;
  userMessage: string;
  language: Language;
  wallets: WalletSummary[];
  conversationHistory: Message[];
};

export type AgentOutput = {
  reply: string;
  modelUsed: string;
  routingTier: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
};

// ─── Main agent entry point ───────────────────────────────────────────────────

export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  const start = Date.now();

  const route = await routeMessage(input.userMessage);
  console.log(`[agent] session=${input.sessionId} tier=${route.tier} model=${route.model} reason=${route.reason}`);

  // Build wallet context for system prompt
  const rateSnap = await getCurrentRate();
  const walletCtx = {
    wallets: input.wallets.map((w) => ({
      nickname: w.nickname,
      type: w.walletType,
      balanceSats: w.balanceSats,
      balanceKes: satsToKes(w.balanceSats, rateSnap.kesPerBtc),
    })),
    totalSats: input.wallets.reduce((sum, w) => sum + w.balanceSats, 0),
    totalKes: input.wallets.reduce((sum, w) => sum + satsToKes(w.balanceSats, rateSnap.kesPerBtc), 0),
    kesPerBtc: rateSnap.kesPerBtc,
    rateIsStale: rateSnap.isStale,
    recentTxCount: 0,
  };

  const systemPrompt = buildSystemPrompt(input.language, walletCtx);
  const compressedHistory = compressHistory(input.conversationHistory);

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...compressedHistory,
    { role: 'user', content: input.userMessage },
  ];

  // Agentic loop — handle tool calls
  let totalIn = 0;
  let totalOut = 0;
  let reply = '';
  const MAX_TOOL_ROUNDS = 3;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await openrouterChat({
      model: route.model,
      messages,
      tools: PHASE1_TOOLS,
      temperature: route.tier === 'heavy' ? 0.2 : 0.4,
      max_tokens: route.tier === 'heavy' ? 2048 : 1024,
    });

    totalIn  += res.usage.prompt_tokens;
    totalOut += res.usage.completion_tokens;

    const choice = res.choices[0];

    // No tool calls — we have the final reply
    if (!choice.message.tool_calls?.length) {
      reply = choice.message.content ?? '';
      break;
    }

    // Process tool calls
    messages.push({ role: 'assistant', content: choice.message.content ?? '' });

    for (const tc of choice.message.tool_calls) {
      // Safety gate — reject any write tool even if AI tries
      if (!isToolCallSafe(tc.function.name)) {
        console.warn(`[agent] Blocked unsafe tool call: ${tc.function.name}`);
        messages.push({
          role: 'user',
          content: `Tool call "${tc.function.name}" is not available in Phase 1. Only read-only tools are permitted.`,
        });
        continue;
      }

      let toolResult: unknown;
      try {
        toolResult = await executeToolCall(
          tc.function.name,
          JSON.parse(tc.function.arguments) as Record<string, unknown>,
          input.sessionId,
          rateSnap.kesPerBtc
        );
      } catch (err) {
        toolResult = { error: (err as Error).message };
      }

      // OpenRouter expects tool results as user messages with tool_call_id
      // We embed them as assistant context for simplicity and broad model compatibility
      messages.push({
        role: 'user',
        content: `[Tool: ${tc.function.name}]\n${JSON.stringify(toolResult, null, 2)}`,
      });
    }
  }

  if (!reply) reply = 'Sorry, I had trouble generating a response. Please try again.';

  return {
    reply,
    modelUsed: route.model,
    routingTier: route.tier,
    tokensIn: totalIn,
    tokensOut: totalOut,
    latencyMs: Date.now() - start,
  };
}

// ─── Tool execution ───────────────────────────────────────────────────────────

async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  sessionId: string,
  kesPerBtc: number
): Promise<unknown> {
  switch (name) {
    case 'get_balance':
      return toolGetBalance(sessionId, args.wallet_id as string | undefined, kesPerBtc);

    case 'get_transactions':
      return toolGetTransactions(sessionId, args);

    case 'get_rate':
      return toolGetRate(args.history_days as number | undefined);

    case 'summarise_period':
      return toolSummarisePeriod(sessionId, args.period as string, kesPerBtc, args.wallet_id as string | undefined);

    case 'explain_transaction':
      return toolExplainTx(sessionId, args.transaction_id as string, kesPerBtc);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function toolGetBalance(
  sessionId: string,
  walletId: string | undefined,
  kesPerBtc: number
) {
  const rows = await query<{
    wallet_conn_id: string; nickname: string; wallet_type: string;
    balance_sats: string; last_synced_at: Date;
  }>(
    `SELECT wc.id as wallet_conn_id, wc.nickname, wc.wallet_type,
            COALESCE(SUM(CASE WHEN t.direction='in' THEN t.amount_sats ELSE -t.amount_sats END), 0) as balance_sats,
            wc.last_synced_at
     FROM wallet_connections wc
     LEFT JOIN transactions_cache t ON t.wallet_conn_id = wc.id
     WHERE wc.session_id = $1 AND wc.is_active = TRUE
     ${walletId ? 'AND wc.id = $2' : ''}
     GROUP BY wc.id, wc.nickname, wc.wallet_type, wc.last_synced_at`,
    walletId ? [sessionId, walletId] : [sessionId]
  );

  const wallets = rows.map((r) => {
    const sats = parseInt(r.balance_sats, 10);
    return {
      walletId: r.wallet_conn_id,
      nickname: r.nickname,
      type: r.wallet_type,
      balanceSats: sats,
      balanceKes: Math.round(satsToKes(sats, kesPerBtc)),
      lastSynced: r.last_synced_at,
    };
  });

  return {
    wallets,
    totalSats: wallets.reduce((s, w) => s + w.balanceSats, 0),
    totalKes:  wallets.reduce((s, w) => s + w.balanceKes, 0),
    kesPerBtc: Math.round(kesPerBtc),
  };
}

async function toolGetTransactions(
  sessionId: string,
  args: Record<string, unknown>
) {
  const limit  = Math.min(parseInt(String(args.limit ?? 20), 10), 100);
  const days   = args.since_days ? parseInt(String(args.since_days), 10) : null;
  const dir    = args.direction && args.direction !== 'all' ? args.direction : null;
  const cat    = args.category ?? null;
  const wallet = args.wallet_id ?? null;

  const rows = await query<{
    external_id: string; direction: string; amount_sats: string;
    fee_sats: string; category: string; memo: string | null;
    occurred_at: Date; wallet_nickname: string; wallet_type: string;
  }>(
    `SELECT t.external_id, t.direction, t.amount_sats, t.fee_sats,
            t.category, t.memo, t.occurred_at,
            wc.nickname as wallet_nickname, wc.wallet_type
     FROM transactions_cache t
     JOIN wallet_connections wc ON wc.id = t.wallet_conn_id
     WHERE t.session_id = $1
       AND ($2::text IS NULL OR wc.id = $2)
       AND ($3::text IS NULL OR t.direction = $3)
       AND ($4::text IS NULL OR t.category = $4)
       AND ($5::int IS NULL OR t.occurred_at >= NOW() - INTERVAL '1 day' * $5)
     ORDER BY t.occurred_at DESC
     LIMIT $6`,
    [sessionId, wallet, dir, cat, days, limit]
  );

  return rows.map((r) => ({
    id: r.external_id,
    direction: r.direction,
    amountSats: parseInt(r.amount_sats, 10),
    feeSats: parseInt(r.fee_sats, 10),
    category: r.category,
    memo: r.memo,
    occurredAt: r.occurred_at,
    wallet: r.wallet_nickname,
    walletType: r.wallet_type,
  }));
}

async function toolGetRate(historyDays?: number) {
  const current = await getCurrentRate();
  const result: Record<string, unknown> = {
    kesPerBtc: Math.round(current.kesPerBtc),
    fetchedAt: current.fetchedAt,
    isStale: current.isStale,
  };

  if (historyDays) {
    const history = await getHistoricalRates(Math.min(historyDays, 90));
    result.history = history.map((h) => ({
      date: h.date.toISOString().split('T')[0],
      kesPerBtc: Math.round(h.kesPerBtc),
    }));
  }

  return result;
}

async function toolSummarisePeriod(
  sessionId: string,
  period: string,
  kesPerBtc: number,
  walletId?: string
) {
  const intervalMap: Record<string, string> = {
    '7d':  '7 days',
    '30d': '30 days',
    '90d': '90 days',
    mtd:   "date_trunc('month', NOW())",
    ytd:   "date_trunc('year', NOW())",
  };

  const interval = intervalMap[period] ?? '30 days';
  const sinceSql = period === 'mtd' || period === 'ytd'
    ? `t.occurred_at >= ${interval}`
    : `t.occurred_at >= NOW() - INTERVAL '${interval}'`;

  const rows = await query<{
    direction: string;
    total_sats: string;
    tx_count: string;
  }>(
    `SELECT t.direction, SUM(t.amount_sats) as total_sats, COUNT(*) as tx_count
     FROM transactions_cache t
     JOIN wallet_connections wc ON wc.id = t.wallet_conn_id
     WHERE t.session_id = $1
       AND ${sinceSql}
       AND ($2::text IS NULL OR wc.id = $2)
     GROUP BY t.direction`,
    [sessionId, walletId ?? null]
  );

  const incoming = rows.find((r) => r.direction === 'in');
  const outgoing = rows.find((r) => r.direction === 'out');

  const inSats  = parseInt(incoming?.total_sats ?? '0', 10);
  const outSats = parseInt(outgoing?.total_sats ?? '0', 10);
  const netSats = inSats - outSats;

  // Get historical rate to compare inflation
  const histRates = await getHistoricalRates(period === '7d' ? 7 : period === '90d' ? 90 : 30);
  const oldRate = histRates[0]?.kesPerBtc ?? kesPerBtc;
  const inflationDeltaKes = Math.round(
    satsToKes(netSats, kesPerBtc) - satsToKes(netSats, oldRate)
  );

  return {
    period,
    incomingSats:    inSats,
    incomingKes:     Math.round(satsToKes(inSats, kesPerBtc)),
    outgoingSats:    outSats,
    outgoingKes:     Math.round(satsToKes(outSats, kesPerBtc)),
    netSats,
    netKes:          Math.round(satsToKes(netSats, kesPerBtc)),
    inflationDeltaKes,
    incomingTxCount: parseInt(incoming?.tx_count ?? '0', 10),
    outgoingTxCount: parseInt(outgoing?.tx_count ?? '0', 10),
  };
}

async function toolExplainTx(
  sessionId: string,
  txId: string,
  kesPerBtc: number
) {
  const row = await query<{
    external_id: string; direction: string; amount_sats: string;
    fee_sats: string; category: string; memo: string | null;
    occurred_at: Date; kes_rate_at_time: string | null;
    wallet_nickname: string;
  }>(
    `SELECT t.external_id, t.direction, t.amount_sats, t.fee_sats,
            t.category, t.memo, t.occurred_at, t.kes_rate_at_time,
            wc.nickname as wallet_nickname
     FROM transactions_cache t
     JOIN wallet_connections wc ON wc.id = t.wallet_conn_id
     WHERE t.session_id = $1 AND t.external_id = $2
     LIMIT 1`,
    [sessionId, txId]
  );

  if (!row.length) return { error: 'Transaction not found' };
  const t = row[0];
  const sats = parseInt(t.amount_sats, 10);
  const rateAtTime = t.kes_rate_at_time ? parseFloat(t.kes_rate_at_time) : null;

  return {
    id: t.external_id,
    direction: t.direction,
    amountSats: sats,
    amountKesToday: Math.round(satsToKes(sats, kesPerBtc)),
    amountKesAtTime: rateAtTime ? Math.round(satsToKes(sats, rateAtTime)) : null,
    valueDeltaKes: rateAtTime
      ? Math.round(satsToKes(sats, kesPerBtc) - satsToKes(sats, rateAtTime))
      : null,
    category: t.category,
    memo: t.memo,
    occurredAt: t.occurred_at,
    wallet: t.wallet_nickname,
  };
}
