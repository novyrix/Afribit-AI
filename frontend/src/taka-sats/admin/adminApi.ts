import { API_URL } from '../../lib/api'

const BASE = `${API_URL}/taka-sats/admin`
export const ADMIN_TOKEN_KEY = 'taka_admin_token'

export type Overview = {
  payment_mode: string
  supervisor_fees_accrued_sats: number
  active_supervisors: number
  active_collectors: number
  today: { collections: number; weight_kg: number; sats: number }
  month: { collections: number; weight_kg: number; sats: number }
  all_time: { collections: number; weight_kg: number; sats: number }
}

export type AdminCollection = {
  collection_ref: string
  collector: string
  supervisor: string
  collection_point: string
  material_type: string
  weight_kg: string
  kes_rate_per_kg: string
  collector_sats: number
  supervisor_sats: number
  total_sats: number
  status: string
  verified_at: string
}

export type AdminSupervisor = {
  id: string
  display_name: string
  fedi_member_key: string | null
  fedi_wallet_address: string | null
  assigned_points: string[]
  active: boolean
  registered_at: string
  collections: string
}

export type AdminCollector = {
  id: string
  display_id: string
  name: string
  wallet_address: string | null
  wallet_type: string
  status: string
  registered_at: string
  collections: string
  earned_sats: string
}

export type RecentPayout = {
  collection_ref: string
  collector: string
  collector_sats: number
  supervisor_sats: number
  total_sats: number
  collector_tx_id: string | null
  paid_at: string | null
}

export type SupervisorFees = {
  supervisor_id: string
  display_name: string
  fees_accrued_sats: string | number
  completed_collections: string | number
}

export type Settlements = {
  payment_mode: string
  supervisor_fees_accrued_sats: number
  collector_paid_out_sats: number
  per_supervisor: SupervisorFees[]
  recent_payouts: RecentPayout[]
}

export type Rate = {
  id: string
  material_type: string
  kes_per_kg: string | number
  effective_from: string
}

export type ReportRow = Record<string, string | number>

async function req<T>(path: string, token: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers as Record<string, string>),
    },
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : {}
  if (!res.ok) throw Object.assign(new Error(body.error || `Request failed (${res.status})`), { status: res.status, body })
  return body as T
}

export const adminApi = {
  overview: (t: string) => req<Overview>('/overview', t),
  collections: (t: string, qs = '') => req<{ collections: AdminCollection[]; total: number; limit: number; offset: number }>(`/collections${qs}`, t),
  collectionsCsvUrl: (qs = '') => `${BASE}/collections${qs ? `${qs}&` : '?'}format=csv`,
  report: (t: string, month: string) => req<{ month: string; by_material: ReportRow[]; by_supervisor: ReportRow[] }>(`/report?month=${encodeURIComponent(month)}`, t),
  supervisors: (t: string) => req<{ supervisors: AdminSupervisor[] }>('/supervisors', t),
  createSupervisor: (t: string, body: Record<string, unknown>) => req<{ id: string; display_name: string }>('/supervisors', t, { method: 'POST', body: JSON.stringify(body) }),
  updateSupervisor: (t: string, id: string, body: Record<string, unknown>) => req<{ id: string; updated: boolean }>(`/supervisors/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  collectors: (t: string) => req<{ collectors: AdminCollector[] }>('/collectors', t),
  createCollector: (t: string, body: Record<string, unknown>) => req<{ id: string; display_id: string; name: string; qr_url: string }>('/collectors', t, { method: 'POST', body: JSON.stringify(body) }),
  updateCollector: (t: string, id: string, body: Record<string, unknown>) => req<{ id: string; updated?: boolean; qr_url?: string; regenerated?: boolean }>(`/collectors/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  settlements: (t: string) => req<Settlements>('/settlements', t),
  rates: (t: string) => req<{ rates: Rate[] }>('/rates', t),
  setRate: (t: string, material_type: string, kes_per_kg: number) => req<{ material_type: string; kes_per_kg: number }>('/rates', t, { method: 'POST', body: JSON.stringify({ material_type, kes_per_kg }) }),
}
