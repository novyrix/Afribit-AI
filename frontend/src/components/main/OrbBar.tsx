import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
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

export function OrbBar({
  token,
  onMessage,
}: {
  token: string
  onMessage?: (m: ChatMessage) => void
}) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const [showHints, setShowHints] = useState(true)

  async function send(text: string) {
    const msg = text.trim()
    if (!msg || sending) return
    setSending(true)
    setShowHints(false)
    onMessage?.({ role: 'user', text: msg })
    setValue('')
    try {
      const res = await api.chat(token, msg)
      onMessage?.({ role: 'assistant', text: res.reply })
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'Request failed'
      onMessage?.({ role: 'assistant', text: m })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <AnimatePresence>
        {showHints && (
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
                className="glass-pill px-3 py-1.5 font-text text-13 text-white/70 hover:text-white"
              >
                {h}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-pill w-full h-14 px-2 flex items-center gap-2">
        <motion.div
          animate={{
            scale: sending ? [1, 1.08, 1] : 1,
            opacity: sending ? [0.6, 1, 0.6] : 1,
          }}
          transition={sending ? { duration: 1.4, repeat: Infinity } : SPRING}
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #FFB75A, #F7931A 60%, #B26A0E)',
            boxShadow: '0 0 18px rgba(247,147,26,0.45)',
          }}
        >
          <Mic size={16} className="text-white" />
        </motion.div>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(value) }}
          placeholder="Ask anything…"
          disabled={sending}
          className="flex-1 bg-transparent outline-none font-text text-15 text-white
                     placeholder:text-white/40 min-w-0"
        />

        <motion.button
          onClick={() => send(value)}
          disabled={!value.trim() || sending}
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
