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
  amount_msats?: number
  amount_msat?: number
  amount_sats?: number
  fees_paid?: number
  feesPaid?: number
  fees_paid_msats?: number
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
  sendPayment?: (paymentRequest: string) => Promise<{ preimage: string }>
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

export async function weblnSendPayment(invoice: string): Promise<{ preimage: string }> {
  const w = provider()
  if (!w) throw new Error('No Lightning wallet detected in this browser.')
  if (!w.sendPayment) throw new Error('Wallet does not support sending payments.')
  await w.enable()
  const res = await w.sendPayment(invoice)
  if (!res || typeof res.preimage !== 'string') {
    throw new Error('Payment did not return a preimage.')
  }
  return { preimage: res.preimage }
}

// NWC-style transaction objects report amounts in millisatoshis.
function msatToSat(v: number | undefined): number {
  if (typeof v !== 'number' || !isFinite(v)) return 0
  return Math.max(0, Math.round(v / 1000))
}

function resolveAmountSats(raw: RawTx): number {
  // Prefer explicit msat fields (NWC standard)
  const msat = raw.amount_msats ?? raw.amount_msat ?? raw.amount
  if (typeof msat === 'number' && msat > 0) {
    const converted = msatToSat(msat)
    // If msat conversion gives 0, the value was already in sats (< 1000 msats = < 1 sat)
    // So treat it directly as sats
    return converted > 0 ? converted : Math.round(msat)
  }
  // Explicit sat field
  if (typeof raw.amount_sats === 'number' && raw.amount_sats > 0) return Math.round(raw.amount_sats)
  return 0
}

function normalize(raw: RawTx, idx: number): WeblnTx | null {
  const amountSats = resolveAmountSats(raw)
  if (amountSats <= 0) return null
  const ts = raw.settled_at ?? raw.settledAt ?? raw.created_at ?? raw.createdAt
  const occurredAt = ts ? new Date(ts * 1000).toISOString() : new Date().toISOString()
  const externalId =
    raw.payment_hash ?? raw.paymentHash ?? raw.preimage ?? `webln-${ts ?? 'x'}-${idx}`
  const feeMsats = raw.fees_paid_msats ?? raw.fees_paid ?? raw.feesPaid
  return {
    externalId,
    direction: raw.type === 'incoming' ? 'in' : 'out',
    amountSats,
    feeSats: msatToSat(feeMsats),
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
      // NWC may wrap result: { result: { transactions: [...] } } or { transactions: [...] }
      const payload = (res as Record<string, unknown>)?.result ?? res
      raw = (payload as { transactions?: RawTx[] })?.transactions ?? []
    }
  } catch {
    return []
  }
  return raw
    .map((t, i) => normalize(t, i))
    .filter((t): t is WeblnTx => t !== null)
}
