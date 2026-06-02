-- Taka Sats — Waste Collection Verification & Payout System
-- Afribit Africa · Kibera, Nairobi · June 2026
-- All objects live in a dedicated `taka_sats` schema.

CREATE SCHEMA IF NOT EXISTS taka_sats;

-- ─── Supervisors ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taka_sats.supervisors (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name       VARCHAR(100) NOT NULL,
  fedi_member_key    VARCHAR(255) UNIQUE,
  fedi_wallet_address VARCHAR(255),
  assigned_points    TEXT[] NOT NULL DEFAULT '{}',
  community_id       UUID,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  registered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registered_by      UUID
);
CREATE INDEX IF NOT EXISTS idx_taka_supervisors_key ON taka_sats.supervisors(fedi_member_key) WHERE fedi_member_key IS NOT NULL;

-- ─── Collectors ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taka_sats.collectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id      VARCHAR(20) NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL,
  wallet_address  VARCHAR(255),
  wallet_type     VARCHAR(20) NOT NULL DEFAULT 'fedi',
  qr_secret       VARCHAR(64) NOT NULL,
  community_id    UUID,
  registered_by   UUID REFERENCES taka_sats.supervisors(id) ON DELETE SET NULL,
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  notes           TEXT,
  CONSTRAINT taka_collectors_wallet_check CHECK (wallet_type IN ('fedi','blink','machankura')),
  CONSTRAINT taka_collectors_status_check CHECK (status IN ('active','paused','inactive'))
);

-- ─── Collections (core audit trail) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taka_sats.collections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_ref   VARCHAR(60) NOT NULL UNIQUE,
  collector_id     UUID NOT NULL REFERENCES taka_sats.collectors(id) ON DELETE RESTRICT,
  supervisor_id    UUID NOT NULL REFERENCES taka_sats.supervisors(id) ON DELETE RESTRICT,
  collection_point VARCHAR(120) NOT NULL,
  material_type    VARCHAR(20) NOT NULL,
  weight_kg        NUMERIC(8,1) NOT NULL,
  kes_rate_per_kg  NUMERIC(10,2) NOT NULL,
  btc_kes_rate     NUMERIC(14,2) NOT NULL,
  collector_sats   INTEGER NOT NULL,
  supervisor_sats  INTEGER NOT NULL,
  total_sats       INTEGER NOT NULL,
  collector_tx_id  VARCHAR(255),
  supervisor_tx_id VARCHAR(255),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  verified_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at          TIMESTAMPTZ,
  notes            TEXT,
  CONSTRAINT taka_collections_material_check CHECK (material_type IN ('plastic','metal','paper','mixed','other')),
  CONSTRAINT taka_collections_status_check CHECK (status IN ('pending','completed','failed','pending_retry'))
);
CREATE INDEX IF NOT EXISTS idx_taka_collections_collector ON taka_sats.collections(collector_id);
CREATE INDEX IF NOT EXISTS idx_taka_collections_supervisor ON taka_sats.collections(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_taka_collections_verified ON taka_sats.collections(verified_at DESC);

-- ─── Payout rates ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taka_sats.payout_rates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type  VARCHAR(20) NOT NULL,
  kes_per_kg     NUMERIC(10,2) NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to   DATE,
  set_by         UUID,
  CONSTRAINT taka_rates_material_check CHECK (material_type IN ('plastic','metal','paper','mixed','other'))
);
CREATE INDEX IF NOT EXISTS idx_taka_rates_active ON taka_sats.payout_rates(material_type) WHERE effective_to IS NULL;

-- ─── Pool (single-row) ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taka_sats.pool (
  id                     INTEGER PRIMARY KEY DEFAULT 1,
  balance_sats           BIGINT NOT NULL DEFAULT 0,
  lnbits_wallet_id       VARCHAR(120),
  warning_threshold_sats BIGINT NOT NULL DEFAULT 50000,
  last_updated           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT taka_pool_singleton CHECK (id = 1)
);

-- ─── Pool transactions (audit) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taka_sats.pool_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          VARCHAR(20) NOT NULL,
  amount_sats   BIGINT NOT NULL,
  reference     VARCHAR(120),
  balance_after BIGINT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID,
  CONSTRAINT taka_pooltx_type_check CHECK (type IN ('deposit','payout','supervisory_fee','refund'))
);
CREATE INDEX IF NOT EXISTS idx_taka_pooltx_created ON taka_sats.pool_transactions(created_at DESC);

-- ─── Admins ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taka_sats.admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  VARCHAR(100) NOT NULL,
  email         VARCHAR(200) UNIQUE,
  pin_hash      VARCHAR(64) NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taka_sats.admin_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID NOT NULL REFERENCES taka_sats.admins(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seed: pool + default Phase 1 rates ─────────────────────────────────────────
INSERT INTO taka_sats.pool (id, balance_sats, warning_threshold_sats)
VALUES (1, 0, 50000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO taka_sats.payout_rates (material_type, kes_per_kg)
SELECT m, r FROM (VALUES
  ('plastic', 20.00),
  ('metal',   30.00),
  ('paper',   10.00),
  ('mixed',   15.00)
) AS seed(m, r)
WHERE NOT EXISTS (
  SELECT 1 FROM taka_sats.payout_rates pr WHERE pr.material_type = seed.m AND pr.effective_to IS NULL
);
