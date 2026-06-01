import { useEffect, useState, useRef, FormEvent } from 'react'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3002'
const TOKEN_KEY = 'sats_token'

type Rate = { kesPerBtc: number; isStale: boolean; source: string }
type ChatMsg = { role: 'user' | 'assistant'; content: string; meta?: string }

export default function App() {
  const [token, setToken]     = useState<string | null>(localStorage.getItem(TOKEN_KEY))
  const [rate, setRate]       = useState<Rate | null>(null)
  const [language, setLang]   = useState<'sw' | 'en' | 'shg'>('sw')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Session bootstrap ───────────────────────────────────────────────────────
  useEffect(() => {
    if (token) return
    fetch(`${API_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.token) {
          localStorage.setItem(TOKEN_KEY, d.token)
          setToken(d.token)
        } else {
          setError('Could not start session')
        }
      })
      .catch(() => setError('Backend unreachable'))
  }, [token, language])

  // ── Live BTC/KES rate ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = () =>
      fetch(`${API_URL}/rates/current`)
        .then((r) => r.json())
        .then((d) => setRate({ kesPerBtc: d.kesPerBtc, isStale: d.isStale, source: d.source }))
        .catch(() => {})
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [])

  // ── Auto-scroll chat ────────────────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // ── Language switch ─────────────────────────────────────────────────────────
  const changeLanguage = async (next: 'sw' | 'en' | 'shg') => {
    setLang(next)
    if (!token) return
    await fetch(`${API_URL}/session/language`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ language: next }),
    }).catch(() => {})
  }

  // ── Send chat ───────────────────────────────────────────────────────────────
  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !token || busy) return
    const msg = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: msg }])
    setBusy(true)
    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: data.reply, meta: `${data.model} · ${data.latencyMs}ms` },
        ])
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: `Hitilafu: ${data.error ?? 'unknown'}` }])
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Server haifikiki.' }])
    } finally {
      setBusy(false)
    }
  }

  const fmtKes = (n: number) =>
    new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(n)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-bitcoin-card/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">₿</span>
            <div>
              <div className="font-bold text-bitcoin-orange leading-none">Afribit SATS</div>
              <div className="text-[11px] text-white/50 leading-none mt-1">Kibera · AI Wallet</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {rate && (
              <div className={`text-right text-xs ${rate.isStale ? 'text-amber-400' : 'text-white/70'}`}>
                <div className="font-semibold">KES {fmtKes(rate.kesPerBtc)}/BTC</div>
                <div className="text-[10px]">{rate.source}{rate.isStale ? ' · stale' : ''}</div>
              </div>
            )}
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as 'sw' | 'en' | 'shg')}
              className="bg-bitcoin-dark border border-white/15 rounded px-2 py-1 text-xs"
            >
              <option value="sw">Swahili</option>
              <option value="en">English</option>
              <option value="shg">Sheng</option>
            </select>
          </div>
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 overflow-hidden">
        <div ref={scrollRef} className="h-full max-w-3xl mx-auto px-4 py-6 overflow-y-auto space-y-3">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
          {messages.length === 0 && !error && (
            <div className="text-center text-white/40 mt-20 space-y-2 text-sm">
              <div className="text-4xl mb-3">👋</div>
              <div>Habari! Mimi ni SATS.</div>
              <div className="text-xs">Uliza chochote kuhusu Bitcoin, wallet yako, au bei ya leo.</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-bitcoin-orange text-black rounded-br-sm'
                    : 'bg-bitcoin-card border border-white/10 rounded-bl-sm'
                }`}
              >
                {m.content}
                {m.meta && <div className="text-[10px] opacity-50 mt-1">{m.meta}</div>}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-bitcoin-card border border-white/10 px-3 py-2 rounded-2xl rounded-bl-sm text-sm">
                <span className="inline-block animate-pulse">SATS inafikiria…</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Composer */}
      <form
        onSubmit={send}
        className="border-t border-white/10 bg-bitcoin-card/60 backdrop-blur-sm"
      >
        <div className="max-w-3xl mx-auto p-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!token || busy}
            placeholder={
              language === 'en' ? 'Ask SATS anything…' :
              language === 'shg' ? 'Bonga na SATS…' :
              'Andika ujumbe…'
            }
            className="flex-1 bg-bitcoin-dark border border-white/15 rounded-full px-4 py-2 text-sm outline-none focus:border-bitcoin-orange disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!token || busy || !input.trim()}
            className="bg-bitcoin-orange text-black font-semibold rounded-full px-4 py-2 text-sm disabled:opacity-40"
          >
            Tuma
          </button>
        </div>
      </form>
    </div>
  )
}
