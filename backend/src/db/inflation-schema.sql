-- Inflation Tracker Schema — Sats Cost of Living Index
-- Afribit Africa · June 2026

-- ─── Communities ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inflation_communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  country       VARCHAR(100) NOT NULL DEFAULT 'Kenya',
  currency      VARCHAR(10)  NOT NULL DEFAULT 'KES',
  currency_symbol VARCHAR(10) NOT NULL DEFAULT 'KSh',
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  joined_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inflation_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name    VARCHAR(100) NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'household',
  community_id    UUID REFERENCES inflation_communities(id) ON DELETE SET NULL,
  phone_hash      VARCHAR(64),
  pin_hash        VARCHAR(64) NOT NULL,
  consent_given   BOOLEAN NOT NULL DEFAULT FALSE,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inflation_users_role_check CHECK (
    role IN ('household','merchant','field-officer','community-admin','super-admin')
  )
);

CREATE INDEX IF NOT EXISTS idx_inflation_users_phone ON inflation_users(phone_hash) WHERE phone_hash IS NOT NULL;

-- ─── Auth sessions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inflation_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES inflation_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inflation_sessions_token ON inflation_sessions(token_hash);

-- ─── Merchants ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inflation_merchants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  community_id    UUID NOT NULL REFERENCES inflation_communities(id) ON DELETE CASCADE,
  category        VARCHAR(100),
  accepts_bitcoin BOOLEAN NOT NULL DEFAULT FALSE,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Item library ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inflation_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_english      VARCHAR(200) NOT NULL,
  name_swahili      VARCHAR(200),
  category          VARCHAR(50) NOT NULL DEFAULT 'other',
  standard_quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  standard_unit     VARCHAR(30) NOT NULL DEFAULT 'piece',
  is_library_item   BOOLEAN NOT NULL DEFAULT TRUE,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inflation_items_category_check CHECK (
    category IN ('food-staple','vegetable','protein','energy','transport','airtime','household','other')
  )
);

-- ─── Purchases ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inflation_purchases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id             UUID REFERENCES inflation_items(id) ON DELETE SET NULL,
  item_name           VARCHAR(200) NOT NULL,
  category            VARCHAR(50) NOT NULL DEFAULT 'other',
  quantity            NUMERIC(10,3) NOT NULL,
  unit                VARCHAR(30) NOT NULL,
  price_kes           NUMERIC(12,4) NOT NULL,
  payment_method      VARCHAR(20) NOT NULL DEFAULT 'cash',
  sats_paid           BIGINT,
  btc_kes_rate        NUMERIC(20,4),
  merchant_id         UUID REFERENCES inflation_merchants(id) ON DELETE SET NULL,
  community_id        UUID NOT NULL REFERENCES inflation_communities(id) ON DELETE CASCADE,
  captured_by         UUID REFERENCES inflation_users(id) ON DELETE SET NULL,
  capture_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status VARCHAR(30) NOT NULL DEFAULT 'unverified',
  notes               TEXT,
  offline_id          VARCHAR(100),
  CONSTRAINT inflation_purchases_payment_check CHECK (
    payment_method IN ('cash','mpesa','bitcoin','other')
  ),
  CONSTRAINT inflation_purchases_verification_check CHECK (
    verification_status IN ('unverified','self-reported','merchant-confirmed','admin-reviewed')
  )
);

CREATE INDEX IF NOT EXISTS idx_inflation_purchases_community ON inflation_purchases(community_id, capture_date);
CREATE INDEX IF NOT EXISTS idx_inflation_purchases_item ON inflation_purchases(item_id, capture_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inflation_purchases_offline ON inflation_purchases(offline_id) WHERE offline_id IS NOT NULL;

-- ─── Seed: pilot community ────────────────────────────────────────────────────
INSERT INTO inflation_communities (id, name, city, country, currency, currency_symbol)
VALUES ('00000000-0000-0000-0000-000000000001', 'Kibera — Soweto West', 'Nairobi', 'Kenya', 'KES', 'KSh')
ON CONFLICT DO NOTHING;

-- ─── Seed: item library (25 standard items) ───────────────────────────────────
INSERT INTO inflation_items (name_english, name_swahili, category, standard_quantity, standard_unit) VALUES
  ('Unga (Maize Flour)',     'Unga wa mahindi',    'food-staple',  2.0,  'kg'),
  ('Rice',                   'Mchele',             'food-staple',  1.0,  'kg'),
  ('Beans',                  'Maharagwe',          'food-staple',  1.0,  'kg'),
  ('Sugar',                  'Sukari',             'food-staple',  1.0,  'kg'),
  ('Salt',                   'Chumvi',             'food-staple',  0.5,  'kg'),
  ('Bread',                  'Mkate',              'food-staple',  1.0,  'loaf'),
  ('Sukuma Wiki',            'Sukuma wiki',        'vegetable',    1.0,  'bunch'),
  ('Tomatoes',               'Nyanya',             'vegetable',    3.0,  'piece'),
  ('Onions',                 'Vitunguu',           'vegetable',    3.0,  'piece'),
  ('Eggs',                   'Mayai',              'protein',      30.0, 'piece'),
  ('Milk',                   'Maziwa',             'protein',      1.0,  'litre'),
  ('Beef',                   'Nyama ya ng''ombe',  'protein',      0.25, 'kg'),
  ('Cooking Oil',            'Mafuta ya kupikia',  'energy',       0.5,  'litre'),
  ('Charcoal',               'Makaa',              'energy',       2.0,  'kg'),
  ('Kerosene',               'Mafuta ya taa',      'energy',       1.0,  'litre'),
  ('Matatu Fare (Kibera-CBD)', 'Nauli ya matatu',  'transport',    1.0,  'trip'),
  ('Airtime (KES 50 bundle)', 'Airtime',           'airtime',      50.0, 'KES'),
  ('Data (1GB bundle)',      'Data ya intaneti',   'airtime',      1.0,  'GB'),
  ('Soap',                   'Sabuni',             'household',    1.0,  'bar'),
  ('Washing Powder',         'Unga wa sabuni',     'household',    0.5,  'kg'),
  ('Toilet Paper',           'Karatasi ya choo',  'household',    1.0,  'roll'),
  ('Wheat Flour',            'Unga wa ngano',      'food-staple',  2.0,  'kg'),
  ('Cooking Gas (6kg)',      'Gesi ya kupikia',    'energy',       6.0,  'kg'),
  ('Avocado',                'Parachichi',         'vegetable',    3.0,  'piece'),
  ('Bananas',                'Ndizi',              'vegetable',    1.0,  'bunch')
ON CONFLICT DO NOTHING;
