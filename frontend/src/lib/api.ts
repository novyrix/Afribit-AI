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
  walletType: 'blink' | 'fedi' | 'webln' | 'nwc'
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
  wallet: { id: string; nickname: string | null; type: 'blink' | 'fedi' | 'webln' | 'nwc' }
}

export type Summary = {
  period: string
  incoming: { sats: number; kes: number; count: number }
  outgoing: { sats: number; kes: number; count: number }
  net: { sats: number; kes: number }
  kesPerBtc: number
}

export type ConnectorStatus = 'verified' | 'in_review' | 'deprecated' | 'community'
export type ConnectorCategory = 'wallet' | 'exchange' | 'on_ramp' | 'off_ramp' | 'data'
export type ConnectorAuthType =
  | 'api_key'
  | 'oauth'
  | 'invite_code'
  | 'nwc_uri'
  | 'none'

export type ConnectorManifest = {
  id: string
  version: string
  name: string
  description: string
  category: ConnectorCategory
  logo: string
  color: string
  website: string
  documentation: string
  license: string
  author: { name: string; github: string; contact?: string }
  capabilities: {
    read_balance: boolean
    read_transactions: boolean
    read_profile: boolean
    create_invoice: boolean
    send_payment: boolean
    on_ramp: boolean
    off_ramp: boolean
  }
  auth: {
    type: ConnectorAuthType
    label?: string
    placeholder?: string
    validation_regex?: string
    help_url?: string
    help_text?: string
  }
  supported_currencies: string[]
  supported_networks: string[]
  regions: string[]
  status: ConnectorStatus
  last_reviewed?: string
}

export type ConnectorTestMethodResult = {
  method: string
  ok: boolean
  ms: number
  error?: string
}

export type ConnectorTestResult = {
  connector: string
  results: ConnectorTestMethodResult[]
  response: { balances: unknown[]; transactions: unknown[] } | null
}

export type ConnectorHealthStatus = 'online' | 'slow' | 'offline' | 'unknown'

export type ConnectorHealth = {
  id: string
  name: string
  status: ConnectorHealthStatus
  latencyMs: number | null
  uptime: number | null
  samples: number
  lastChecked: number | null
}

export type ConnectorHealthResponse = {
  connectors: ConnectorHealth[]
  checkedAt: number
}

export type SubmitConfig = {
  emailEnabled: boolean
  githubEnabled: boolean
}

export type ConnectorSubmission = {
  emailToken: string
  name: string
  githubUsername: string
  organization?: string
  repoUrl: string
  connectorId: string
  category: 'wallet' | 'exchange' | 'on-ramp' | 'data'
  working: 'yes' | 'in_progress'
  rationale: string
  declarations: {
    readOnly: boolean
    testsPass: boolean
    maintain: boolean
    terms: boolean
  }
}

export type SubmissionResult = {
  issueUrl: string
  issueNumber: number
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
    return json<{ walletConnId: string; federationId: string; existing?: boolean }>(res)
  },

  async pushFediTransactions(
    token: string,
    walletConnId: string,
    transactions: Array<{
      externalId: string
      direction: 'in' | 'out'
      amountSats: number
      feeSats: number
      memo: string | null
      occurredAt: string
    }>,
  ) {
    const res = await fetch(`${API_URL}/wallets/fedi/${walletConnId}/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ transactions }),
    })
    return json<{ pushed: number; inserted: number; skipped: number }>(res)
  },

  async setWalletBalance(
    token: string,
    kind: 'fedi' | 'webln' | 'nwc',
    walletConnId: string,
    balanceSats: number,
  ) {
    const res = await fetch(`${API_URL}/wallets/${kind}/${walletConnId}/balance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ balanceSats }),
    })
    return json<{ walletConnId: string; balanceSats: number }>(res)
  },

  async connectWebln(token: string, externalId: string | null, nickname?: string) {
    const res = await fetch(`${API_URL}/wallets/webln`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ externalId, nickname }),
    })
    return json<{ walletConnId: string; externalId: string | null; nickname: string | null }>(res)
  },

  async pushWeblnTransactions(
    token: string,
    walletConnId: string,
    transactions: Array<{
      externalId: string
      direction: 'in' | 'out'
      amountSats: number
      feeSats: number
      memo: string | null
      occurredAt: string
    }>,
  ) {
    const res = await fetch(`${API_URL}/wallets/webln/${walletConnId}/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ transactions }),
    })
    return json<{ pushed: number; inserted: number; skipped: number }>(res)
  },

  async connectNwc(token: string, externalId: string | null, nickname?: string) {
    const res = await fetch(`${API_URL}/wallets/nwc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ externalId, nickname }),
    })
    return json<{ walletConnId: string; externalId: string | null; nickname: string | null }>(res)
  },

  async pushNwcTransactions(
    token: string,
    walletConnId: string,
    transactions: Array<{
      externalId: string
      direction: 'in' | 'out'
      amountSats: number
      feeSats: number
      memo: string | null
      occurredAt: string
    }>,
  ) {
    const res = await fetch(`${API_URL}/wallets/nwc/${walletConnId}/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ transactions }),
    })
    return json<{ pushed: number; inserted: number; skipped: number }>(res)
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

  async listConnectors(params?: { category?: string; status?: string }) {
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.status) qs.set('status', params.status)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    const res = await fetch(`${API_URL}/connectors${suffix}`)
    return json<{ connectors: ConnectorManifest[]; total: number }>(res)
  },

  async getConnector(id: string) {
    const res = await fetch(`${API_URL}/connectors/${encodeURIComponent(id)}`)
    return json<ConnectorManifest>(res)
  },

  async testConnector(id: string, credential?: string) {
    const res = await fetch(`${API_URL}/connectors/${encodeURIComponent(id)}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credential ? { credential } : {}),
    })
    return json<ConnectorTestResult>(res)
  },

  async getConnectorHealth() {
    const res = await fetch(`${API_URL}/connectors/health`)
    return json<ConnectorHealthResponse>(res)
  },

  async getSubmitConfig() {
    const res = await fetch(`${API_URL}/connectors/submit/config`)
    return json<SubmitConfig>(res)
  },

  async sendSubmitCode(email: string) {
    const res = await fetch(`${API_URL}/connectors/submit/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return json<{ ok: boolean }>(res)
  },

  async verifySubmitCode(email: string, code: string) {
    const res = await fetch(`${API_URL}/connectors/submit/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    return json<{ emailToken: string }>(res)
  },

  async submitConnector(payload: ConnectorSubmission) {
    const res = await fetch(`${API_URL}/connectors/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return json<SubmissionResult>(res)
  },
}
