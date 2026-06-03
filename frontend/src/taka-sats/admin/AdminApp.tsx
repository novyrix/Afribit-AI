import { useEffect, useState } from 'react'
import { adminApi, ADMIN_TOKEN_KEY } from './adminApi'
import { TAKA_TOKEN_KEY } from '../lib/api'
import { Card, Btn, Field, Input, ErrorNote, COLORS } from './ui'
import OverviewTab from './OverviewTab'
import CollectionsTab from './CollectionsTab'
import CollectorsTab from './CollectorsTab'
import SupervisorsTab from './SupervisorsTab'
import PoolTab from './PoolTab'
import RatesTab from './RatesTab'
import ReportTab from './ReportTab'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'collections', label: 'Collections' },
  { id: 'collectors', label: 'Collectors' },
  { id: 'supervisors', label: 'Supervisors' },
  { id: 'pool', label: 'Settlements' },
  { id: 'rates', label: 'Rates' },
  { id: 'report', label: 'Report' },
] as const

type TabId = typeof TABS[number]['id']

export default function AdminApp() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(ADMIN_TOKEN_KEY) ?? '')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<TabId>('overview')

  useEffect(() => {
    if (authed) return
    const supToken = localStorage.getItem(TAKA_TOKEN_KEY)
    if (supToken) {
      adminApi.overview(supToken).then(() => {
        setToken(supToken)
        setAuthed(true)
      }).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!authed) return <Login token={token} setToken={setToken} onAuth={() => setAuthed(true)} />

  function logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setToken('')
    setAuthed(false)
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg }}>
      <header className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between" style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
        <div>
          <span className="font-brand text-lg" style={{ color: COLORS.bitcoin }}>Taka Sats</span>
          <span className="font-ui text-sm text-white/40 ml-2">Admin</span>
        </div>
        <Btn variant="ghost" onClick={logout}>Sign out</Btn>
      </header>

      <nav className="px-5 pt-4 flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="font-ui text-sm px-3 py-1.5 rounded-pill transition-colors"
            style={tab === t.id
              ? { background: COLORS.bitcoin, color: COLORS.bg }
              : { background: 'transparent', color: 'rgba(255,255,255,0.6)', border: `1px solid ${COLORS.border}` }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-5 max-w-6xl mx-auto">
        {tab === 'overview' && <OverviewTab token={token} />}
        {tab === 'collections' && <CollectionsTab token={token} />}
        {tab === 'collectors' && <CollectorsTab token={token} />}
        {tab === 'supervisors' && <SupervisorsTab token={token} />}
        {tab === 'pool' && <PoolTab token={token} />}
        {tab === 'rates' && <RatesTab token={token} />}
        {tab === 'report' && <ReportTab token={token} />}
      </main>
    </div>
  )
}

function Login({ token, setToken, onAuth }: { token: string; setToken: (t: string) => void; onAuth: () => void }) {
  const [value, setValue] = useState(token)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setBusy(true)
    setError('')
    try {
      await adminApi.overview(value.trim())
      localStorage.setItem(ADMIN_TOKEN_KEY, value.trim())
      setToken(value.trim())
      onAuth()
    } catch {
      setError('Invalid admin token')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: COLORS.bg }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="font-brand text-2xl" style={{ color: COLORS.bitcoin }}>Taka Sats Admin</div>
          <div className="font-ui text-sm text-white/40">Enter your admin token to continue</div>
        </div>
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Admin token">
              <Input type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder="token" autoFocus />
            </Field>
            {error && <ErrorNote msg={error} />}
            <Btn type="submit" disabled={busy} className="w-full">{busy ? 'Checking…' : 'Sign in'}</Btn>
          </form>
        </Card>
      </div>
    </div>
  )
}
