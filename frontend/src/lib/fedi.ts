export type FediInfo = {
  alias: string | null
  pubkey: string | null
  externalId: string
}

type FediGlobal = {
  getAuthenticatedMember?: () => Promise<{ id?: string; username?: string }>
  getActiveFederation?: () => Promise<{ id?: string; name?: string }>
}

type NostrGlobal = {
  getPublicKey?: () => Promise<string>
}

function fediGlobal(): FediGlobal | null {
  if (typeof window === 'undefined') return null
  const w = (window as unknown as { fedi?: FediGlobal }).fedi
  return w ?? null
}

function nostrGlobal(): NostrGlobal | null {
  if (typeof window === 'undefined') return null
  const w = (window as unknown as { nostr?: NostrGlobal }).nostr
  return w ?? null
}

export function isInFedi(): boolean {
  if (typeof window === 'undefined') return false
  if (fediGlobal() !== null) return true
  if (nostrGlobal()?.getPublicKey) return true
  const ua = navigator.userAgent || ''
  return /fedi/i.test(ua)
}

export async function readNostrPubkey(): Promise<string | null> {
  const n = nostrGlobal()
  if (!n?.getPublicKey) return null
  try {
    const pk = await n.getPublicKey()
    return pk?.trim() || null
  } catch {
    return null
  }
}

export async function readFediFederation(): Promise<{ id: string | null; name: string | null }> {
  const f = fediGlobal()
  if (!f?.getActiveFederation) return { id: null, name: null }
  try {
    const fed = await f.getActiveFederation()
    return { id: fed?.id ?? null, name: fed?.name ?? null }
  } catch {
    return { id: null, name: null }
  }
}
