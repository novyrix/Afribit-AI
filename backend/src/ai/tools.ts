import type { ToolDefinition } from './openrouter';

/**
 * Phase 1 tools — ALL read-only.
 * No send_payment, no create_invoice, no write operations of any kind.
 * These are the only tools the AI can call in Phase 1.
 */

export const PHASE1_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_balance',
      description:
        'Get the current balance across all connected wallets, or a specific wallet. Returns sats and KES equivalent.',
      parameters: {
        type: 'object',
        properties: {
          wallet_id: {
            type: 'string',
            description: 'Optional. Specific wallet ID to query. Omit for total across all wallets.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_transactions',
      description:
        'Get transaction history. Supports filtering by wallet, date range, direction (in/out), and category.',
      parameters: {
        type: 'object',
        properties: {
          wallet_id: { type: 'string', description: 'Filter to a specific wallet. Omit for all wallets.' },
          direction: { type: 'string', enum: ['in', 'out', 'all'], description: 'Filter by direction.' },
          category:  { type: 'string', description: 'Filter by category (income, savings, program_reward, payment).' },
          since_days:{ type: 'number', description: 'Return transactions from the last N days.' },
          limit:     { type: 'number', description: 'Max number of transactions to return (default 20, max 100).' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_rate',
      description: 'Get the current BTC/KES exchange rate and recent rate history.',
      parameters: {
        type: 'object',
        properties: {
          history_days: {
            type: 'number',
            description: 'Optional. Number of days of rate history to include (max 90).',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'summarise_period',
      description:
        'Summarise financial activity for a period: total income, total outgoing, net change, inflation delta vs KES savings.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['7d', '30d', '90d', 'mtd', 'ytd'],
            description: 'Period to summarise. mtd = month-to-date, ytd = year-to-date.',
          },
          wallet_id: { type: 'string', description: 'Optional wallet filter.' },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'explain_transaction',
      description: 'Explain a specific transaction in plain language — what it was, what it was worth then vs now.',
      parameters: {
        type: 'object',
        properties: {
          transaction_id: { type: 'string', description: 'The external transaction ID.' },
        },
        required: ['transaction_id'],
      },
    },
  },
];

// Tool names as a set for validation
export const PHASE1_TOOL_NAMES = new Set(PHASE1_TOOLS.map((t) => t.function.name));

// Safety check: ensure AI never attempts a write tool
export const WRITE_TOOL_NAMES = new Set([
  'send_payment',
  'create_invoice',
  'transfer',
  'withdraw',
  'deposit',
  'sign',
  'broadcast',
]);

export function isToolCallSafe(toolName: string): boolean {
  if (WRITE_TOOL_NAMES.has(toolName)) return false;
  if (!PHASE1_TOOL_NAMES.has(toolName)) return false;
  return true;
}
