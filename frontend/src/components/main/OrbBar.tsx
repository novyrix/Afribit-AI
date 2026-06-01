import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Mic } from '../ui/Icons'
import { api } from '../../lib/api'

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 240 }

const HINTS = [
  'How much do I have?',
  "This week's income",
  'Am I up this month?',
]

export type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
}

type SR = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
}

function getSR(): (new () => SR) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SR
    webkitSpeechRecognition?: new () => SR
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function OrbBar({
  token,
  thinking = false,
  onMessage,
  onError,
  onActivity,
}: {
  token: string
  thinking?: boolean
  onMessage?: (m: ChatMessage) => void
  onError?: () => void
  onActivity?: () => void
}) {
  const [value, setValue] = useState('')
  const [showHints, setShowHints] = useState(true)
  const [listening, setListening] = useState(false)
  const recRef = useRef<SR | null>(null)

  async function send(text: string) {
    const msg = text.trim()
    if (!msg || thinking) return
    setShowHints(false)
    onMessage?.({ role: 'user', text: msg })
    setValue('')
    try {
      const res = await api.chat(token, msg)
      onMessage?.({ role: 'assistant', text: res.reply })
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'Request failed'
      onMessage?.({ role: 'assistant', text: m })
      onError?.()
    }
  }

  useEffect(() => () => {
    try { recRef.current?.stop() } catch { /* noop */ }
  }, [])

  function startVoice() {
    if (listening) {
      try { recRef.current?.stop() } catch { /* noop */ }
      setListening(false)
      return
    }
    if (thinking) return
    const Ctor = getSR()
    if (!Ctor) {
      onMessage?.({ role: 'assistant', text: 'Voice input not supported on this device. Please type your question.' })
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    let finalText = ''
    rec.onstart = () => setListening(true)
    rec.onresult = (e) => {
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        const t = r[0]?.transcript ?? ''
        if (i === e.results.length - 1) interim = t
        finalText = t
      }
      setValue(interim || finalText)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => {
      setListening(false)
      const t = finalText.trim()
      if (t) send(t)
    }
    recRef.current = rec
    try {
      rec.start()
    } catch {
      setListening(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <AnimatePresence>
        {showHints && !thinking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={SPRING}
            className="flex gap-2 flex-wrap justify-center px-2"
          >
            {HINTS.map((h) => (
              <button
                key={h}
                onClick={() => send(h)}
                className="glass-pill px-3 py-1.5 font-ui text-13 text-white/70 hover:text-white"
              >
                {h}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {listening && (
        <div className="font-ui text-12 text-white/40">Listening…</div>
      )}

      <div className="glass-pill w-full h-14 px-2 flex items-center gap-2">
        <motion.button
          onClick={startVoice}
          whileTap={{ scale: 0.94 }}
          animate={{ scale: listening ? [1, 1.10, 1] : 1 }}
          transition={listening ? { duration: 1.2, repeat: Infinity } : SPRING}
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{
            background: listening
              ? 'radial-gradient(circle at 30% 30%, #FF8A4A, #E5601A 60%, #8E3A07)'
              : 'radial-gradient(circle at 30% 30%, #FFB75A, #F7931A 60%, #B26A0E)',
            boxShadow: listening
              ? '0 0 24px rgba(247,147,26,0.75)'
              : '0 0 18px rgba(247,147,26,0.45)',
          }}
          aria-label={listening ? 'Stop listening' : 'Start voice input'}
        >
          {listening ? (
            <div className="flex items-end gap-[2px] h-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="w-[2px] bg-white rounded-full"
                  animate={{ height: ['4px', '14px', '4px'] }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          ) : (
            <Mic size={16} className="text-white" />
          )}
        </motion.button>

        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); onActivity?.() }}
          onKeyDown={(e) => { if (e.key === 'Enter') send(value) }}
          placeholder={listening ? 'Listening…' : thinking ? 'Thinking…' : 'Ask anything…'}
          disabled={thinking}
          className="flex-1 bg-transparent outline-none font-ui text-15 text-white
                     placeholder:text-white/40 min-w-0 disabled:opacity-60"
        />

        <motion.button
          onClick={() => send(value)}
          disabled={!value.trim() || thinking}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', damping: 18, stiffness: 320 }}
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center
                     bg-white/10 border border-white/20 text-white
                     disabled:opacity-30 disabled:cursor-not-allowed
                     hover:bg-white/15 transition-colors"
          aria-label="Send"
        >
          <ArrowUp size={18} />
        </motion.button>
      </div>
    </div>
  )
}
