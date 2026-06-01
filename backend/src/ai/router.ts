import { config } from '../config';
import { openrouterChat } from './openrouter';

/**
 * Routing tiers:
 *
 *  FAST  — google/gemini-flash-1.5 (~$0.075/1M in, ~$0.30/1M out)
 *          Used for: balance checks, greetings, simple yes/no, intent detection
 *
 *  MID   — anthropic/claude-haiku-4-5 (~$1/1M in, ~$5/1M out)
 *          Used for: transaction history queries, category summaries, basic education
 *
 *  HEAVY — anthropic/claude-sonnet-4-5 (~$3/1M in, ~$15/1M out)
 *          Used for: multi-wallet analytics, inflation calculations,
 *                    financial health reports, period comparisons
 *
 * The router first runs a FAST classification pass (a few dozen tokens),
 * then routes the real request to the appropriate model.
 * Average cost per session is dramatically reduced vs always using Sonnet.
 */

export type RoutingTier = 'fast' | 'mid' | 'heavy';

export type RoutingDecision = {
  tier: RoutingTier;
  model: string;
  reason: string;
};

// ─── Intent classification prompt ────────────────────────────────────────────

const CLASSIFY_SYSTEM = `You are a router for a Bitcoin wallet AI assistant.
Classify the user's message into exactly one of these tiers:

FAST  - Simple balance check, greeting, "how much do I have", wallet connection status
MID   - Transaction history, recent payments, category summaries, Bitcoin education basics
HEAVY - Inflation comparison, period analysis, financial health report, multi-wallet analytics, savings rate calculation, custom date ranges

Respond with ONLY one word: FAST, MID, or HEAVY. No explanation.`;

// ─── Router ───────────────────────────────────────────────────────────────────

export async function routeMessage(userMessage: string): Promise<RoutingDecision> {
  // First try regex fast-path to avoid even the classification API call
  const regexTier = regexClassify(userMessage);
  if (regexTier) return { ...regexTier, model: modelForTier(regexTier.tier) };

  // Use the fast model to classify
  try {
    const res = await openrouterChat({
      model: config.openrouter.models.fast,
      messages: [
        { role: 'system', content: CLASSIFY_SYSTEM },
        { role: 'user', content: userMessage.slice(0, 500) },
      ],
      temperature: 0,
      max_tokens: 5,
    });

    const raw = (res.choices[0]?.message.content ?? 'MID').trim().toUpperCase();
    const tier: RoutingTier = raw === 'FAST' ? 'fast' : raw === 'HEAVY' ? 'heavy' : 'mid';

    return {
      tier,
      model: modelForTier(tier),
      reason: `classifier→${raw}`,
    };
  } catch {
    // Fallback to MID on classifier failure
    return { tier: 'mid', model: config.openrouter.models.mid, reason: 'classifier-failed→mid' };
  }
}

function modelForTier(tier: RoutingTier): string {
  return config.openrouter.models[tier];
}

// ─── Regex fast-path (zero API calls for obvious cases) ───────────────────────

const FAST_PATTERNS = [
  /\b(balance|bakaa|nina|ngapi|total|how much|bei|pochi|sats?)\b/i,
  /\b(hello|hujambo|habari|hi|hey|salaam)\b/i,
  /\b(connected|online|status|working)\b/i,
];

const HEAVY_PATTERNS = [
  /\b(inflation|mfumuko|purchasing power|ununuzi|compare|compared|vs\s+kes|vs\s+mpesa)\b/i,
  /\b(last\s+(month|year|quarter)|mwezi\s+(uliopita|huu)|financial\s+health)\b/i,
  /\b(savings?\s+rate|how\s+much\s+(saved|income|earn)|income\s+trend|report)\b/i,
  /\b(period|range|from\s+\w+\s+to\s+\w+|between)\b/i,
];

function regexClassify(msg: string): Omit<RoutingDecision, 'model'> | null {
  if (HEAVY_PATTERNS.some((p) => p.test(msg))) {
    return { tier: 'heavy', reason: 'regex→heavy' };
  }
  if (FAST_PATTERNS.some((p) => p.test(msg))) {
    return { tier: 'fast', reason: 'regex→fast' };
  }
  return null;
}
