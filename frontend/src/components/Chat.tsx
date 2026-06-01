import { useEffect, useRef, useState, FormEvent } from 'react'
import { api, type Language } from '../lib/api'

type Msg = { role: 'user' | 'assistant'; content: string; meta?: string }

const placeholder: Record<Language, string> = {
  sw: 'Andika ujumbe…',
  en: 'Ask SATS anything…',
  shg: 'Bonga na SATS…',
}

const sendLabel: Record<Language, string> = { sw: 'Tuma', en: 'Send', shg: 'Tuma' }

const welcome: Record<Language, { hi: string; sub: string }> = {
  sw: { hi: 'Habari! Mimi ni SATS.', sub: 'Uliza chochote kuhusu Bitcoin, wallet yako, au bei ya leo.' },
  en: { hi: 'Hi! I am SATS.',        sub: 'Ask me anything about Bitcoin, your wallet, or today\'s rate.' },
  shg: { hi: 'Sasa! Mi ni SATS.',    sub: 'Niulize kuhusu Bitcoin, wallet yako, ama rate ya leo.' },
}

const thinking: Record<Language, string> = {
  sw: 'SATS inafikiria…',
  en: 'SATS is thinking…',
  shg: 'SATS inafikiria…',
}

export function Chat({ token, language }: { token: string | null; language: Language }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !token || busy) return
    const msg = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: msg }])
    setBusy(true)
    try {
      const data = await api.chat(token, msg)
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.reply, meta: `${data.model} · ${data.latencyMs}ms` },
      ])
    } catch (err: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠ ${err.message}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-white/40 mt-20 space-y-2 text-sm">
              <div className="text-5xl mb-3">👋</div>
              <div className="text-base text-white/70">{welcome[language].hi}</div>
              <div className="text-xs max-w-xs mx-auto">{welcome[language].sub}</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
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
                <span className="inline-block animate-pulse">{thinking[language]}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={send} className="border-t border-white/10 bg-bitcoin-card/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto p-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!token || busy}
            placeholder={placeholder[language]}
            className="flex-1 bg-bitcoin-dark border border-white/15 rounded-full px-4 py-2 text-sm outline-none focus:border-bitcoin-orange disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!token || busy || !input.trim()}
            className="bg-bitcoin-orange text-black font-semibold rounded-full px-4 py-2 text-sm disabled:opacity-40"
          >
            {sendLabel[language]}
          </button>
        </div>
      </form>
    </>
  )
}
