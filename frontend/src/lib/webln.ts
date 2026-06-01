export type WeblnInfo = {
  alias: string | null
  pubkey: string | null
}

export type WeblnTx = {
  externalId: string
  direction: 'in' | 'out'
  amountSats: number
  feeSats: number
  memo: string | null
  occurredAt: string
}

type RawTx = {
  type?: string
  amount?: number
  fees_paid?: number
  feesPaid?: number
  settled_at?: number
  settledAt?: number
  created_at?: number
  createdAt?: number
  payment_hash?: string
  paymentHash?: string
  preimage?: string
  description?: string
  memo?: string
}

interface WeblnProvider {
  enable(): Promise<void>
  getInfo(): Promise<{ node?: { alias?: string; pubkey?: string }; methods?: string[] }>
  getBalance?: () => Promise<{ balance: number; currency?: string }>
  listTransactions?: (args?: { limit?: number }) => Promise<{ transactions: RawTx[] }>
  request?: (method: string, args?: unknown) => Promise<{ transactions?: RawTx[] }>
}

function provider(): WeblnProvider | null {
  if (typeof window === 'undefined') return null
  const w = (window as unknown as { webln?: WeblnProvider }).webln
  return w ?? null
}

export function isWeblnAvailable(): boolean {
  return provider() !== null
}

export async function enableWebln(): Promise<WeblnInfo> {
  const w = provider()
  if (!w) throw new Error('No Lightning wallet detected in this browser.')
  await w.enable()
  let alias: string | null = null
  let pubkey: string | null = null
  try {
    const info = await w.getInfo()
    alias = info?.node?.alias ?? null
    pubkey = info?.node?.pubkey ?? null
  } catch {
    /* getInfo is optional on some providers */
  }
  return { alias, pubkey }
}

export async function getWeblnBalanceSats(): Promise<number | null> {
  const w = provider()
  if (!w?.getBalance) return null
  try {
    const res = await w.getBalance()
    if (typeof res?.balance !== 'number') return null
    return Math.round(res.balance)
  } catch {
    return null
  }
}

// NWC-style transaction objects report amounts in millisatoshis.
function msatToSat(v: number | undefined): number {
  if (typeof v !== 'number' || !isFinite(v)) return 0
  return Math.max(0, Math.round(v / 1000))
}

function normalize(raw: RawTx, idx: number): WeblnTx | null {
  const amountSats = msatToSat(raw.amount)
  if (amountSats <= 0) return null
  const ts = raw.settled_at ?? raw.settledAt ?? raw.created_at ?? raw.createdAt
  const occurredAt = ts ? new Date(ts * 1000).toISOString() : new Date().toISOString()
  const externalId =
    raw.payment_hash ?? raw.paymentHash ?? raw.preimage ?? `webln-${ts ?? 'x'}-${idx}`
  return {
    externalId,
    direction: raw.type === 'incoming' ? 'in' : 'out',
    amountSats,
    feeSats: msatToSat(raw.fees_paid ?? raw.feesPaid),
    memo: raw.description ?? raw.memo ?? null,
    occurredAt,
  }
}

export async function listWeblnTransactions(limit = 100): Promise<WeblnTx[]> {
  const w = provider()
  if (!w) return []
  let raw: RawTx[] = []
  try {
    if (w.listTransactions) {
      const res = await w.listTransactions({ limit })
      raw = res?.transactions ?? []
    } else if (w.request) {
      const res = await w.request('list_transactions', { limit })
      raw = res?.transactions ?? []
    }
  } catch {
    return []
  }
  return raw
    .map((t, i) => normalize(t, i))
    .filter((t): t is WeblnTx => t !== null)
}
