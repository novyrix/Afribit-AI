-- Afribit SATS — PostgreSQL Schema
-- Run via: tsx src/db/migrate.ts

-- Sessions: one per browser/device. No user accounts — keys are identity.
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  language      VARCHAR(10) NOT NULL DEFAULT 'sw',
  metadata      JSONB NOT NULL DEFAULT '{}'
);

-- Wallet connections per session
CREATE TABLE IF NOT EXISTS wallet_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  wallet_type   VARCHAR(20) NOT NULL CHECK (wallet_type IN ('blink', 'fedi', 'byok')),
  nickname      VARCHAR(100) NOT NULL DEFAULT '',
  -- encrypted_key is AES-GCM ciphertext; we store it here as a backup
  -- The frontend also stores it encrypted in IndexedDB
  -- We NEVER log or expose this field
  encrypted_key TEXT,
  -- For Blink: wallet_id from GraphQL. For Fedi: federation_id
  external_id   VARCHAR(255),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_wallet_connections_session
  ON wallet_connections(session_id) WHERE is_active = TRUE;

-- Cached transactions (server-side cache for analytics + offline)
CREATE TABLE IF NOT EXISTS transactions_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_conn_id  UUID NOT NULL REFERENCES wallet_connections(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  external_id     VARCHAR(255) NOT NULL,
  direction       VARCHAR(4) NOT NULL CHECK (direction IN ('in', 'out')),
  amount_sats     BIGINT NOT NULL,
  fee_sats        BIGINT NOT NULL DEFAULT 0,
  category        VARCHAR(30) NOT NULL DEFAULT 'unknown',
  memo            TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL,
  kes_rate_at_time NUMERIC(20, 8),
  raw             JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wallet_conn_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_txns_session_time
  ON transactions_cache(session_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_txns_wallet_time
  ON transactions_cache(wallet_conn_id, occurred_at DESC);

-- BTC/KES rate history (5-min snapshots from CoinGecko)
CREATE TABLE IF NOT EXISTS rate_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  kes_per_btc NUMERIC(20, 4) NOT NULL,
  source      VARCHAR(20) NOT NULL DEFAULT 'coingecko',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_snapshots_time
  ON rate_snapshots(captured_at DESC);

-- Current rate cache (single-row table for fast lookup)
CREATE TABLE IF NOT EXISTS rate_cache (
  id          INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  kes_per_btc NUMERIC(20, 4) NOT NULL,
  source      VARCHAR(20) NOT NULL DEFAULT 'coingecko',
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_stale    BOOLEAN NOT NULL DEFAULT FALSE
);

-- AI conversation history per session
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  model_used  VARCHAR(100),
  tokens_in   INT,
  tokens_out  INT,
  latency_ms  INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session_time
  ON conversations(session_id, created_at DESC);

-- Audit log (no keys, no balances — only structural events)
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL,
  event       VARCHAR(50) NOT NULL,
  detail      JSONB NOT NULL DEFAULT '{}',
  ip_hash     VARCHAR(64),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incoming webhook events (idempotency store)
CREATE TABLE IF NOT EXISTS webhook_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      VARCHAR(20) NOT NULL CHECK (source IN ('blink', 'btcpay')),
  event_id    VARCHAR(255) NOT NULL,
  event_type  VARCHAR(50) NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  processed   BOOLEAN NOT NULL DEFAULT FALSE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_source_processed
  ON webhook_events(source, processed);
