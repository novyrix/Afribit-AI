import { useEffect, useState } from 'react'
import { adminApi, type Rate } from './adminApi'
import { Card, Spinner, ErrorNote, Btn, Input, COLORS } from './ui'

const MATERIALS = ['plastic', 'metal', 'paper', 'mixed', 'other']

export default function RatesTab({ token }: { token: string }) {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')

  function load() {
    setLoading(true)
    adminApi.rates(token)
      .then((d) => setRates(d.rates))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [token])

  function currentFor(material: string) {
    return rates.find((r) => r.material_type === material)
  }

  async function save(material: string) {
    const val = parseFloat(edits[material] ?? '')
    if (!Number.isFinite(val) || val <= 0) return
    setBusy(material)
    try { await adminApi.setRate(token, material, val); setEdits((e) => ({ ...e, [material]: '' })); load() }
    catch (e) { setError((e as Error).message) }
    finally { setBusy('') }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      {error && <ErrorNote msg={error} />}
      <Card>
        <div className="font-brand text-base mb-1" style={{ color: COLORS.bitcoin }}>Payout rates (KES per kg)</div>
        <div className="font-ui text-xs text-white/40 mb-4">Rates convert to sats at collection time using the live BTC/KES price.</div>
        <div className="space-y-3">
          {MATERIALS.map((m) => {
            const cur = currentFor(m)
            return (
              <div key={m} className="flex items-center gap-3">
                <div className="w-24 font-ui text-sm text-white capitalize">{m}</div>
                <div className="w-32 font-mono text-sm text-white/60">{cur ? `${cur.kes_per_kg} KES/kg` : 'not set'}</div>
                <div className="w-32">
                  <Input
                    value={edits[m] ?? ''}
                    onChange={(e) => setEdits((s) => ({ ...s, [m]: e.target.value }))}
                    inputMode="decimal"
                    placeholder="new rate"
                  />
                </div>
                <Btn variant="ghost" disabled={busy === m || !edits[m]} onClick={() => save(m)}>Update</Btn>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
