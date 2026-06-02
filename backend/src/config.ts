import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: parseInt(optional('PORT', '3001'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),

  db: {
    url: required('DATABASE_URL'),
  },

  openrouter: {
    apiKey: required('OPENROUTER_API_KEY'),
    baseUrl: optional('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
    models: {
      fast:  optional('OR_MODEL_FAST',  'deepseek/deepseek-chat'),
      mid:   optional('OR_MODEL_MID',   'deepseek/deepseek-chat'),
      heavy: optional('OR_MODEL_HEAVY', 'deepseek/deepseek-chat'),
    },
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: '24h',
  },

  coingecko: {
    apiKey: optional('COINGECKO_DEMO_KEY', ''),
    cacheTtlMs: 5 * 60 * 1000,
  },

  blink: {
    apiKey: optional('BLINK_API_KEY', ''),
    webhookSecret: optional('BLINK_WEBHOOK_SECRET', ''),
  },

  exchangeRate: {
    url: optional('EXCHANGE_RATE_API_URL', 'https://open.er-api.com/v6/latest/USD'),
  },

  rateLimit: {
    windowMs:   parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max:        parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
    aiWindowMs: parseInt(optional('AI_RATE_LIMIT_WINDOW_MS', '300000'), 10),
    aiMax:      parseInt(optional('AI_RATE_LIMIT_MAX', '20'), 10),
  },

  cors: {
    origin: optional('CORS_ORIGIN', 'http://localhost:5173'),
  },

  encryption: {
    key: optional('ENCRYPTION_KEY', ''),
  },
} as const;
