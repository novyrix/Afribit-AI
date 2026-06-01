import { query, queryOne } from '../db/client';
import { config } from '../config';

export type RateSnapshot = {
  kesPerBtc: number;
  fetchedAt: Date;
  isStale: boolean;
  source: string;
};

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=kes';
const BLINK_PRICE_URL =
  'https://api.blink.sv/graphql';
const MEMPOOL_URL =
  'https://mempool.space/api/v1/prices';

let inFlightFetch: Promise<number> | null = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the current BTC/KES rate.
 * Priority: Blink(USD) × ExchangeRate-API → CoinGecko → Mempool × ExchangeRate-API → stale cache
 */
export async function getCurrentRate(): Promise<RateSnapshot> {
  const cached = await getCachedRate();
  if (cached && !cached.isStale) return cached;

  if (!inFlightFetch) {
    inFlightFetch = fetchAndCache().finally(() => { inFlightFetch = null; });
  }

  try {
    const kesPerBtc = await inFlightFetch;
    return { kesPerBtc, fetchedAt: new Date(), isStale: false, source: 'live' };
  } catch {
    if (cached) return { ...cached, isStale: true };
    throw new Error('BTC/KES rate unavailable and no cached value exists');
  }
}

/** Returns historical daily rates for inflation comparison */
export async function getHistoricalRates(days = 30): Promise<{ date: Date; kesPerBtc: number }[]> {
  const rows = await query<{ captured_at: Date; kes_per_btc: string }>(
    `SELECT DISTINCT ON (date_trunc('day', captured_at))
       captured_at, kes_per_btc
     FROM rate_snapshots
     WHERE captured_at >= NOW() - INTERVAL '1 day' * $1
     ORDER BY date_trunc('day', captured_at), captured_at DESC`,
    [days]
  );

  if (rows.length < 2) {
    return fetchHistoricalFromCoinGecko(days);
  }

  return rows.map((r) => ({
    date: new Date(r.captured_at),
    kesPerBtc: parseFloat(r.kes_per_btc),
  }));
}

/** Convert sats to KES using current rate */
export function satsToKes(sats: number, kesPerBtc: number): number {
  return (sats / 100_000_000) * kesPerBtc;
}

/** Convert KES to sats using current rate */
export function kesToSats(kes: number, kesPerBtc: number): number {
  return Math.round((kes / kesPerBtc) * 100_000_000);
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function getCachedRate(): Promise<RateSnapshot | null> {
  const row = await queryOne<{
    kes_per_btc: string;
    fetched_at: Date;
    is_stale: boolean;
    source: string;
  }>('SELECT kes_per_btc, fetched_at, is_stale, source FROM rate_cache WHERE id = 1');

  if (!row) return null;

  const ageMs = Date.now() - new Date(row.fetched_at).getTime();
  const isStale = ageMs > config.coingecko.cacheTtlMs;

  return {
    kesPerBtc: parseFloat(row.kes_per_btc),
    fetchedAt: new Date(row.fetched_at),
    isStale,
    source: row.source,
  };
}

async function fetchAndCache(): Promise<number> {
  let kesPerBtc: number;
  let source: string;

  const usdToKes = await fetchUsdToKes();

  // 1. Blink real-time USD price × ExchangeRate-API
  try {
    const btcUsd = await fetchFromBlink();
    kesPerBtc = btcUsd * usdToKes;
    source = 'blink+er-api';
    console.log(`[rates] Blink BTC/USD=${btcUsd}, USD/KES=${usdToKes} → BTC/KES=${kesPerBtc}`);
  } catch (blinkErr) {
    console.warn('[rates] Blink failed:', (blinkErr as Error).message);

    // 2. CoinGecko (native KES)
    try {
      kesPerBtc = await fetchFromCoinGecko();
      source = 'coingecko';
      console.log(`[rates] CoinGecko BTC/KES=${kesPerBtc}`);
    } catch (cgErr) {
      console.warn('[rates] CoinGecko failed:', (cgErr as Error).message);

      // 3. Mempool USD × ExchangeRate-API
      try {
        const btcUsd = await fetchFromMempool();
        kesPerBtc = btcUsd * usdToKes;
        source = 'mempool+er-api';
        console.log(`[rates] Mempool BTC/USD=${btcUsd} → BTC/KES=${kesPerBtc}`);
      } catch (mempoolErr) {
        throw new Error(`All rate sources failed. Last: ${(mempoolErr as Error).message}`);
      }
    }
  }

  await Promise.all([
    query(
      `INSERT INTO rate_cache (id, kes_per_btc, source, fetched_at, is_stale)
       VALUES (1, $1, $2, NOW(), FALSE)
       ON CONFLICT (id) DO UPDATE
         SET kes_per_btc = EXCLUDED.kes_per_btc,
             source      = EXCLUDED.source,
             fetched_at  = EXCLUDED.fetched_at,
             is_stale    = FALSE`,
      [kesPerBtc, source]
    ),
    query(
      `INSERT INTO rate_snapshots (kes_per_btc, source) VALUES ($1, $2)`,
      [kesPerBtc, source]
    ),
  ]);

  console.log(`[rates] Cached BTC/KES = ${kesPerBtc} from ${source}`);
  return kesPerBtc;
}

/** Fetch live USD/KES from open.er-api.com (free, no key required) */
async function fetchUsdToKes(): Promise<number> {
  try {
    const res = await fetch(config.exchangeRate.url, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`ExchangeRate-API HTTP ${res.status}`);
    const data = (await res.json()) as { rates?: { KES?: number } };
    const rate = data.rates?.KES;
    if (!rate || rate <= 0) throw new Error('ExchangeRate-API missing KES rate');
    return rate;
  } catch (err) {
    console.warn('[rates] ExchangeRate-API failed, using fallback 129:', (err as Error).message);
    return 129; // approximate fallback
  }
}

/** Fetch BTC/USD from Blink public price API (no auth required) */
async function fetchFromBlink(): Promise<number> {
  const query = /* graphql */ `
    query BtcPrice {
      btcPrice {
        base
        offset
        currencyUnit
        formattedAmount
      }
    }
  `;
  const res = await fetch(BLINK_PRICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Blink HTTP ${res.status}`);
  const body = (await res.json()) as {
    data?: { btcPrice?: { base: number; offset: number } };
    errors?: { message: string }[];
  };
  if (body.errors?.length) throw new Error(`Blink GQL: ${body.errors[0].message}`);
  const price = body.data?.btcPrice;
  if (!price) throw new Error('Blink returned no price data');
  // Blink price: base * 10^(-offset) gives USD per BTC
  return price.base * Math.pow(10, -price.offset);
}

async function fetchFromCoinGecko(): Promise<number> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (config.coingecko.apiKey) {
    headers['x-cg-demo-api-key'] = config.coingecko.apiKey;
  }

  const res = await fetch(COINGECKO_URL, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

  const data = (await res.json()) as { bitcoin?: { kes?: number } };
  const rate = data.bitcoin?.kes;
  if (!rate) throw new Error('CoinGecko response missing bitcoin.kes');
  return rate;
}

/** Returns BTC/USD (not KES) */
async function fetchFromMempool(): Promise<number> {
  const res = await fetch(MEMPOOL_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Mempool HTTP ${res.status}`);
  const data = (await res.json()) as { USD?: number };
  if (!data.USD) throw new Error('Mempool response missing USD price');
  return data.USD;
}

async function fetchHistoricalFromCoinGecko(
  days: number
): Promise<{ date: Date; kesPerBtc: number }[]> {
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=kes&days=${days}&interval=daily`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = (await res.json()) as { prices?: [number, number][] };
    return (data.prices ?? []).map(([ts, price]) => ({
      date: new Date(ts),
      kesPerBtc: price,
    }));
  } catch {
    return [];
  }
}

