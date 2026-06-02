import { useEffect, useState } from 'react'
import { API_URL } from '../lib/api'

type VerifyResult = {
  valid: boolean
  error?: string
  display_id?: string
  name?: string
  status?: string
  member_since?: string
  last_collection?: string | null
  lifetime_sats?: number
}

export default function VerifyPage() {
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id') ?? ''
    const k = params.get('k') ?? ''
    if (!id || !k) {
      setResult({ valid: false, error: 'Missing card details' })
      setLoading(false)
      return
    }
    fetch(`${API_URL}/taka-sats/verify?id=${encodeURIComponent(id)}&k=${encodeURIComponent(k)}`)
      .then((r) => r.json())
      .then((b) => setResult(b))
      .catch(() => setResult({ valid: false, error: 'Network error' }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B0B0F' }}>
      <div className="w-full max-w-sm rounded-card p-6" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-center mb-4">
          <div className="font-brand text-lg" style={{ color: '#F7931A' }}>Taka Sats</div>
          <div className="font-ui text-xs text-white/50">Collector card verification</div>
        </div>
        {loading ? (
          <div className="text-center text-white/60 py-8 font-ui">Verifying…</div>
        ) : result?.valid ? (
          <div className="space-y-3">
            <div className="text-center py-3 rounded-glass" style={{ background: 'rgba(0,200,150,0.12)', color: '#00C896' }}>
              <div className="font-brand text-base">Valid card</div>
            </div>
            <Field label="Collector" value={result.name ?? '—'} />
            <Field label="Card ID" value={result.display_id ?? '—'} />
            <Field label="Status" value={result.status ?? '—'} />
            <Field label="Member since" value={result.member_since ? new Date(result.member_since).toLocaleDateString() : '—'} />
            <Field label="Lifetime sats" value={(result.lifetime_sats ?? 0).toLocaleString()} />
          </div>
        ) : (
          <div className="text-center py-6 rounded-glass" style={{ background: 'rgba(255,77,77,0.12)', color: '#FF4D4D' }}>
            <div className="font-brand text-base">Not valid</div>
            <div className="font-ui text-sm text-white/60 mt-1">{result?.error ?? 'Unknown error'}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-ui text-sm text-white/50">{label}</span>
      <span className="font-mono text-sm text-white">{value}</span>
    </div>
  )
}
