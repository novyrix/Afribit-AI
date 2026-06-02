import { useEffect, useState } from 'react'
import { adminApi, type AdminSupervisor } from './adminApi'
import { Card, Spinner, ErrorNote, Btn, Field, Input, COLORS } from './ui'

export default function SupervisorsTab({ token }: { token: string }) {
  const [rows, setRows] = useState<AdminSupervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [memberKey, setMemberKey] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [points, setPoints] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    adminApi.supervisors(token)
      .then((d) => setRows(d.supervisors))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [token])

  async function register(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await adminApi.createSupervisor(token, {
        display_name: name.trim(),
        fedi_member_key: memberKey.trim() || undefined,
        fedi_wallet_address: walletAddress.trim() || undefined,
        assigned_points: points.split(',').map((p) => p.trim()).filter(Boolean),
      })
      setName(''); setMemberKey(''); setWalletAddress(''); setPoints('')
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(s: AdminSupervisor) {
    await adminApi.updateSupervisor(token, s.id, { active: !s.active })
    load()
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="font-brand text-base mb-3" style={{ color: COLORS.bitcoin }}>Register supervisor</div>
        <form onSubmit={register} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Display name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></Field>
          <Field label="Fedi member key"><Input value={memberKey} onChange={(e) => setMemberKey(e.target.value)} placeholder="member key for login" /></Field>
          <Field label="Fedi wallet address (payout)"><Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="lightning address" /></Field>
          <Field label="Assigned points (comma-separated)"><Input value={points} onChange={(e) => setPoints(e.target.value)} placeholder="Kibera, Mathare" /></Field>
          <div className="md:col-span-2">
            <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Register supervisor'}</Btn>
          </div>
        </form>
      </Card>

      {error && <ErrorNote msg={error} />}
      {loading ? <Spinner /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="font-ui text-xs uppercase tracking-wide text-white/40">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Points</th>
                <th className="py-2 pr-3 text-right">Collections</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {rows.map((s) => (
                <tr key={s.id} className="border-t" style={{ borderColor: COLORS.border }}>
                  <td className="py-2 pr-3 text-white">{s.display_name}</td>
                  <td className="py-2 pr-3 text-white/70 font-ui">{(s.assigned_points ?? []).join(', ') || '—'}</td>
                  <td className="py-2 pr-3 text-right text-white/70">{s.collections}</td>
                  <td className="py-2 pr-3" style={{ color: s.active ? COLORS.positive : COLORS.negative }}>{s.active ? 'yes' : 'no'}</td>
                  <td className="py-2">
                    <Btn variant="ghost" className="!px-2 !py-1 !text-xs" onClick={() => toggleActive(s)}>{s.active ? 'Deactivate' : 'Activate'}</Btn>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-white/40 font-ui">No supervisors</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
