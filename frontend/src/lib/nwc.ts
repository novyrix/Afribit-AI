export type NwcInfo = {
  alias: string | null
  pubkey: string | null
  balanceSats: number | null
}

export type NwcTx = {
  externalId: string
  direction: 'in' | 'out'
  amountSats: number
  feeSats: number
  memo: string | null
  occurredAt: string
}

type RawNwcTx = {
  type?: string
  invoice?: string
  amount?: number
  fees_paid?: number
  settled_at?: number | null
  created_at?: number
  payment_hash?: string
  preimage?: string
  description?: string
}

import { secureSet, secureGet, secureRemove } from './secureStore'

const KEY_PREFIX = 'sats_nwc_'

export function isNwcUri(value: string): boolean {
  return /^nostr\+walletconnect:\/\/[0-9a-f]{2,}/i.test(value.trim())
}

export async function storeNwcUri(walletConnId: string, uri: string): Promise<void> {
  await secureSet(KEY_PREFIX + walletConnId, uri)
}

export async function loadNwcUri(walletConnId: string): Promise<string | null> {
  const name = KEY_PREFIX + walletConnId
  const secure = await secureGet(name)
  if (secure) return secure
  let legacy: string | null = null
  try { legacy = localStorage.getItem(name) } catch { return null }
  if (legacy && isNwcUri(legacy)) {
    await secureSet(name, legacy)
    return legacy
  }
  return null
}

export function clearNwcUri(walletConnId: string): void {
  secureRemove(KEY_PREFIX + walletConnId)
}

function msatToSat(v: number | undefined | null): number {
  if (typeof v !== 'number' || !isFinite(v)) return 0
  return Math.max(0, Math.round(v / 1000))
}

async function newClient(uri: string) {
  const { NWCClient } = await import('@getalby/sdk')
  return new NWCClient({ nostrWalletConnectUrl: uri.trim() })
}

export async function connectNwc(uri: string): Promise<NwcInfo> {
  if (!isNwcUri(uri)) throw new Error('That does not look like a valid connection string.')
  const client = await newClient(uri)
  try {
    let alias: string | null = null
    let pubkey: string | null = null
    try {
      const info = await client.getInfo()
      alias = info?.alias ?? null
      pubkey = info?.pubkey ?? null
    } catch { /* getInfo optional */ }

    let balanceSats: number | null = null
    try {
      const bal = await client.getBalance()
      balanceSats = msatToSat(bal?.balance)
    } catch { /* get_balance may be unsupported */ }

    return { alias, pubkey, balanceSats }
  } finally {
    client.close()
  }
}

export async function listNwcTransactions(uri: string, limit = 100): Promise<NwcTx[]> {
  const client = await newClient(uri)
  try {
    const res = await client.listTransactions({ limit })
    const raw: RawNwcTx[] = res?.transactions ?? []
    return raw
      .map((t, i) => {
        const amountSats = msatToSat(t.amount)
        if (amountSats <= 0) return null
        const ts = t.settled_at ?? t.created_at
        const externalId =
          t.payment_hash ?? t.preimage ?? t.invoice ?? `nwc-${ts ?? 'x'}-${i}`
        return {
          externalId,
          direction: t.type === 'incoming' ? 'in' : 'out',
          amountSats,
          feeSats: msatToSat(t.fees_paid),
          memo: t.description ?? null,
          occurredAt: ts ? new Date(ts * 1000).toISOString() : new Date().toISOString(),
        } as NwcTx
      })
      .filter((t): t is NwcTx => t !== null)
  } catch {
    return []
  } finally {
    client.close()
  }
}
