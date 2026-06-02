const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3002') as string

export const INFLATION_TOKEN_KEY = 'inflation_token'
export const INFLATION_COMMUNITY_KEY = 'inflation_community_id'

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
  return body as T
}

export type InflationUser = {
  id: string
  display_name: string
  role: string
  community_id: string | null
  consent_given: boolean
}

export type InflationItem = {
  id: string
  name_english: string
  name_swahili: string | null
  category: string
  standard_quantity: number
  standard_unit: string
}

export type InflationCommunity = {
  id: string
  name: string
  city: string
  country: string
  currency: string
  currency_symbol: string
}

export type InflationMerchant = {
  id: string
  name: string
  category: string | null
  accepts_bitcoin: boolean
}

export type PurchasePayload = {
  item_id?: string
  item_name: string
  category: string
  quantity: number
  unit: string
  price_kes: number
  payment_method: 'cash' | 'mpesa' | 'bitcoin' | 'other'
  sats_paid?: number
  merchant_id?: string
  community_id: string
  capture_date?: string
  notes?: string
  offline_id?: string
}

export type AdminSummary = {
  total_purchases: number
  items_tracked: number
  contributors: number
  merchants_active: number
  bitcoin_purchases: number
  pending_review: number
}

export type PriceTrendRow = {
  item_name: string
  category: string
  week: string
  avg_kes: number
  avg_sats: number | null
  count: number
}

export type ReviewEntry = {
  id: string
  item_name: string
  category: string
  quantity: number
  unit: string
  price_kes: number
  payment_method: string
  sats_paid: number | null
  capture_date: string
  notes: string | null
  verification_status: string
  created_at: string
  contributor: string
}

export type CategoryStat = {
  category: string
  total: number
  avg_kes_per_unit: number
  bitcoin_count: number
}

export type ReportItem = {
  item_name: string
  category: string
  avg_kes_per_unit: number
  avg_sats_per_unit: number | null
  data_points: number
}

export type ReportAdoption = {
  total: number
  bitcoin: number
}

export const inflationApi = {
  async register(data: {
    display_name: string
    role: string
    community_id?: string
    phone?: string
    pin: string
    consent_given: boolean
  }) {
    const res = await fetch(`${BASE}/inflation/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return json<{ token: string; user: InflationUser }>(res)
  },

  async login(data: { phone?: string; display_name?: string; pin: string }) {
    const res = await fetch(`${BASE}/inflation/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return json<{ token: string; user: InflationUser }>(res)
  },

  async recordConsent(token: string) {
    const res = await fetch(`${BASE}/inflation/auth/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    })
    return json<{ ok: boolean }>(res)
  },

  async me(token: string) {
    const res = await fetch(`${BASE}/inflation/auth/me`, {
      headers: authHeaders(token),
    })
    return json<{ user: InflationUser }>(res)
  },

  async getCommunities() {
    const res = await fetch(`${BASE}/inflation/communities`)
    return json<InflationCommunity[]>(res)
  },

  async getItems() {
    const res = await fetch(`${BASE}/inflation/items`)
    return json<InflationItem[]>(res)
  },

  async getMerchants(token: string, communityId: string) {
    const res = await fetch(`${BASE}/inflation/communities/${communityId}/merchants`, {
      headers: authHeaders(token),
    })
    return json<InflationMerchant[]>(res)
  },

  async submitPurchase(token: string, purchase: PurchasePayload) {
    const res = await fetch(`${BASE}/inflation/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(purchase),
    })
    return json<{ id: string; captureDate: string; btcKesRate: number | null }>(res)
  },

  async syncBatch(token: string, purchases: PurchasePayload[]) {
    const res = await fetch(`${BASE}/inflation/purchases/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ purchases }),
    })
    return json<{ submitted: number; inserted: number; ids: string[] }>(res)
  },

  async getAdminSummary(token: string, communityId: string) {
    const res = await fetch(`${BASE}/inflation/admin/summary?community_id=${communityId}`, {
      headers: authHeaders(token),
    })
    return json<AdminSummary>(res)
  },

  async getPriceTrends(token: string, communityId: string, days = 90) {
    const res = await fetch(`${BASE}/inflation/admin/price-trends?community_id=${communityId}&days=${days}`, {
      headers: authHeaders(token),
    })
    return json<PriceTrendRow[]>(res)
  },

  async getReviewQueue(token: string, communityId: string) {
    const res = await fetch(`${BASE}/inflation/admin/review-queue?community_id=${communityId}`, {
      headers: authHeaders(token),
    })
    return json<ReviewEntry[]>(res)
  },

  async reviewPurchase(token: string, id: string, status: 'admin-reviewed' | 'flagged' | 'rejected') {
    const res = await fetch(`${BASE}/inflation/admin/review/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ status }),
    })
    return json<{ ok: boolean; status: string }>(res)
  },

  async getCategoryBreakdown(token: string, communityId: string) {
    const res = await fetch(`${BASE}/inflation/admin/category-breakdown?community_id=${communityId}`, {
      headers: authHeaders(token),
    })
    return json<CategoryStat[]>(res)
  },

  async getLatestReport(communityId: string) {
    const res = await fetch(`${BASE}/inflation/reports/latest?community_id=${communityId}`)
    return json<{ month: string | null; items: ReportItem[]; prevItems?: { item_name: string; avg_kes_per_unit: number }[]; adoption: ReportAdoption | null }>(res)
  },

  async getReport(communityId: string, month: string) {
    const res = await fetch(`${BASE}/inflation/reports/${month}?community_id=${communityId}`)
    return json<{ month: string; items: ReportItem[]; prevItems: { item_name: string; avg_kes_per_unit: number }[]; adoption: ReportAdoption | null }>(res)
  },
}
