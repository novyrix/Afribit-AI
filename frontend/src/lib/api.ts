export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3002'

export const TOKEN_KEY = 'sats_token'

export type Language = 'sw' | 'en' | 'shg'

export type Rate = {
  kesPerBtc: number
  isStale: boolean
  source: string
  fetchedAt?: string
}

export type ChatReply = {
  reply: string
  model: string
  tier: string
  latencyMs: number
}

export type WalletConnection = {
  id: string
  walletType: 'blink' | 'fedi'
  externalId: string | null
  nickname: string | null
  status: string
  lastSyncedAt: string | null
  createdAt: string
}

export type Transaction = {
  id: string
  externalId: string
  direction: 'in' | 'out'
  amountSats: number
  amountKes: number
  feeSats: number
  category: string
  memo: string | null
  occurredAt: string
  wallet: { id: string; nickname: string | null; type: 'blink' | 'fedi' }
}

export type Summary = {
  period: string
  incoming: { sats: number; kes: number; count: number }
  outgoing: { sats: number; kes: number; count: number }
  net: { sats: number; kes: number }
  kesPerBtc: number
}

async function json<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { /* noop */ }
  if (!res.ok) {
    const msg = data?.error ?? data?.message ?? res.statusText
    throw new Error(`${res.status}: ${msg}`)
  }
  return data as T
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = {
  async createSession(language: Language) {
    const res = await fetch(`${API_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    })
    return json<{ sessionId: string; token: string; language: Language }>(res)
  },

  async setLanguage(token: string, language: Language) {
    const res = await fetch(`${API_URL}/session/language`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ language }),
    })
    return json<{ language: Language }>(res)
  },

  async getRate() {
    const res = await fetch(`${API_URL}/rates/current`)
    return json<Rate>(res)
  },

  async chat(token: string, message: string) {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ message }),
    })
    return json<ChatReply>(res)
  },

  async listWallets(token: string) {
    const res = await fetch(`${API_URL}/wallets`, { headers: authHeaders(token) })
    const data = await json<WalletConnection[] | { wallets: WalletConnection[] }>(res)
    return { wallets: Array.isArray(data) ? data : data.wallets }
  },

  async connectBlink(token: string, apiKey: string, nickname?: string) {
    const res = await fetch(`${API_URL}/wallets/blink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ apiKey, nickname }),
    })
    return json<{ walletConnId: string; externalId: string; nickname: string | null }>(res)
  },

  async connectFedi(token: string, federationId: string, inviteCode?: string, nickname?: string) {
    const res = await fetch(`${API_URL}/wallets/fedi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ federationId, inviteCode, nickname }),
    })
    return json<{ walletConnId: string; federationId: string }>(res)
  },

  async getWalletBalance(token: string, walletConnId: string) {
    const res = await fetch(`${API_URL}/wallets/${walletConnId}/balance`, {
      headers: authHeaders(token),
    })
    return json<{
      walletConnId: string
      nickname: string | null
      balanceSats: number
      balanceKes: number
      kesPerBtc: number
      rateIsStale: boolean
    }>(res)
  },

  async syncWallet(token: string, walletConnId: string) {
    const res = await fetch(`${API_URL}/wallets/${walletConnId}/sync`, {
      method: 'POST',
      headers: authHeaders(token),
    })
    return json<{ ok: boolean }>(res)
  },

  async listTransactions(token: string, limit = 50) {
    const res = await fetch(`${API_URL}/transactions?limit=${limit}`, {
      headers: authHeaders(token),
    })
    const data = await json<Transaction[] | { transactions: Transaction[]; count?: number }>(res)
    return Array.isArray(data)
      ? { transactions: data, count: data.length }
      : { transactions: data.transactions, count: data.count ?? data.transactions.length }
  },

  async getSummary(token: string, windowDays = 30) {
    const res = await fetch(`${API_URL}/transactions/summary?windowDays=${windowDays}`, {
      headers: authHeaders(token),
    })
    return json<Summary>(res)
  },
}
