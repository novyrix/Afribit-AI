import { API_URL } from '../../lib/api'

const BASE = `${API_URL}/taka-sats`
export const TAKA_TOKEN_KEY = 'taka_token'
export const TAKA_ROLE_KEY = 'taka_role'

export type TakaRole = 'collector' | 'supervisor' | 'user'

export type IdentifyResult =
  | { role: 'user' }
  | {
      role: 'supervisor'
      token: string
      supervisor_id: string
      display_name: string
      assigned_points: string[]
      is_admin: boolean
    }
  | {
      role: 'collector'
      token: string
      collector_id: string
      display_id: string
      display_name: string
      status: string
    }

export type CollectorCard = {
  display_id: string
  name: string
  status: string
  member_since: string
  qr_url: string
  lifetime_sats: number
  month_sats: number
  collections: number
  rank: number | null
  last_collection: string | null
}

export type CollectionRow = {
  collection_ref: string
  collection_point?: string
  material_type: string
  weight_kg: string | number
  collector_sats: number
  supervisor_sats?: number
  status: string
  verified_at: string
}

export type LeaderRow = {
  display_id: string
  name: string
  lifetime_sats: number
  collections: number
}

async function req<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...headers, ...(opts.headers as Record<string, string>) } })
  const text = await res.text()
  const body = text ? JSON.parse(text) : {}
  if (!res.ok) throw Object.assign(new Error(body.error || `Request failed (${res.status})`), { status: res.status, body })
  return body as T
}

export const takaApi = {
  identify(payload: { wallet_type: 'fedi' | 'blink' | 'machankura'; member_key?: string; wallet_address?: string }) {
    return req<IdentifyResult>('/auth/identify', { method: 'POST', body: JSON.stringify(payload) })
  },
  collectorCard(token: string) {
    return req<CollectorCard>('/collector/me', {}, token)
  },
  collectorHistory(token: string) {
    return req<{ collections: CollectionRow[] }>('/collector/history', {}, token)
  },
  leaderboard(communityId?: string) {
    const q = communityId ? `?community_id=${encodeURIComponent(communityId)}` : ''
    return req<LeaderRow[]>(`/leaderboard${q}`)
  },
  supervisorMe(token: string) {
    return req<{
      display_name: string
      assigned_points: string[]
      payment_mode: string
    }>('/supervisor/me', {}, token)
  },
  supervisorScan(token: string, id: string, k: string) {
    return req<{ valid: boolean; error?: string; collector_id?: string; display_id?: string; name?: string; status?: string; lifetime_sats?: number }>(
      '/supervisor/scan', { method: 'POST', body: JSON.stringify({ id, k }) }, token,
    )
  },
  supervisorLog(token: string, payload: {
    collector_id: string
    collection_point: string
    material_type: string
    weight_kg: number
    notes?: string
  }) {
    return req<{
      status: string
      collection_id: string
      collection_ref: string
      collector_sats: number
      supervisor_sats: number
      total_sats: number
      kes_per_btc: number
      kes_equivalent: number
      collector_wallet_address: string
      collector_wallet_type: string
      collector_name: string
      memo: string
    }>('/supervisor/collections', { method: 'POST', body: JSON.stringify(payload) }, token)
  },
  supervisorCollectionResult(token: string, collectionId: string, payload: {
    success: boolean
    preimage?: string
    error?: string
  }) {
    return req<{ status: string; collection_ref: string; error?: string }>(
      `/supervisor/collections/${encodeURIComponent(collectionId)}/result`,
      { method: 'POST', body: JSON.stringify(payload) }, token,
    )
  },
  supervisorToday(token: string) {
    return req<{ collections: CollectionRow[]; total_weight_kg: number; total_sats: number }>(
      '/supervisor/today', {}, token,
    )
  },
  supervisorEarnings(token: string) {
    return req<{ today_sats: number; week_sats: number; month_sats: number; all_time_sats: number }>(
      '/supervisor/earnings', {}, token,
    )
  },
  supervisorRegisterCollector(token: string, payload: { name: string; wallet_address?: string; wallet_type?: string; notes?: string }) {
    return req<{ id: string; display_id: string; name: string; qr_url: string }>(
      '/supervisor/collectors', { method: 'POST', body: JSON.stringify(payload) }, token,
    )
  },
  getRates() {
    return req<{ kes_per_btc: number; rates: { material_type: string; kes_per_kg: number }[] }>(
      '/rates/current',
    )
  },
}
