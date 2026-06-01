import { useEffect, useState } from 'react'
import { api, type Language, type Rate } from './lib/api'
import { Chat } from './components/Chat'
import { Wallets } from './components/Wallets'
import { Transactions } from './components/Transactions'

type Tab = 'chat' | 'wallets' | 'tx'

const TOKEN_KEY = 'sats_token'
const LANG_KEY = 'sats_lang'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY))
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem(LANG_KEY) as Language) || 'sw'
  )
  const [rate, setRate] = useState<Rate | null>(null)
  const [tab, setTab] = useState<Tab>('chat')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) return
    api.createSession(language)
      .then((d) => {
        localStorage.setItem(TOKEN_KEY, d.token)
        setToken(d.token)
      })
      .catch((e) => setError(`Session failed: ${e.message}`))
  }, [token, language])

  useEffect(() => {
    let cancelled = false
    const load = () =>
      api.getRate()
        .then((r) => { if (!cancelled) setRate(r) })
        .catch(() => {})
    load()
    const t = setInterval(load, 60_000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const changeLanguage = async (next: Language) => {
    setLanguage(next)
    localStorage.setItem(LANG_KEY, next)
    if (token) await api.setLanguage(token, next).catch(() => {})
  }

  const fmtKes = (n: number) =>
    new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(n)

  const tabs: { id: Tab; label: Record<Language, string> }[] = [
    { id: 'chat',    label: { sw: 'Mazungumzo', en: 'Chat',     shg: 'Bonga' } },
    { id: 'wallets', label: { sw: 'Mikoba',     en: 'Wallets',  shg: 'Wallets' } },
    { id: 'tx',      label: { sw: 'Miamala',    en: 'History',  shg: 'History' } },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-bitcoin-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-bitcoin-orange flex items-center justify-center text-black font-black text-lg flex-shrink-0">
              ₿
            </div>
            <div className="min-w-0">
              <div className="font-bold text-bitcoin-orange leading-none truncate">Afribit SATS</div>
              <div className="text-[11px] text-white/50 leading-none mt-1">Kibera · AI Wallet</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {rate && (
              <div className={`text-right text-xs ${rate.isStale ? 'text-amber-400' : 'text-white/70'}`}>
                <div className="font-semibold tabular-nums">KES {fmtKes(rate.kesPerBtc)}</div>
                <div className="text-[10px]">{rate.source}{rate.isStale ? ' · stale' : ''}</div>
              </div>
            )}
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as Language)}
              className="bg-bitcoin-dark border border-white/15 rounded px-2 py-1 text-xs"
              aria-label="Language"
            >
              <option value="sw">SW</option>
              <option value="en">EN</option>
              <option value="shg">SHG</option>
            </select>
          </div>
        </div>
        <nav className="max-w-3xl mx-auto px-4 flex gap-1 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-bitcoin-orange text-bitcoin-orange font-medium'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              {t.label[language]}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className="max-w-3xl mx-auto w-full px-4 mt-3">
          <div className="bg-red-900/40 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">
            {error}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'chat'    && <Chat token={token} language={language} />}
        {tab === 'wallets' && <Wallets token={token} language={language} />}
        {tab === 'tx'      && <Transactions token={token} language={language} rate={rate} />}
      </main>
    </div>
  )
}
