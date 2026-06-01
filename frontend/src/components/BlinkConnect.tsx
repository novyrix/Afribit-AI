import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Bolt, Eye, EyeOff, Check, ChevronRight } from './ui/Icons'
import { Glass, PillButton } from './ui/Glass'
import { api } from '../lib/api'

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 220 }

type Phase = 'detecting' | 'manual' | 'connecting' | 'success' | 'error'

export function BlinkConnect({
  token, onBack, onHelp, onDone,
}: {
  token: string
  onBack: () => void
  onHelp: () => void
  onDone: (walletConnId: string) => void
}) {
  const [phase, setPhase] = useState<Phase>('detecting')
  const [apiKey, setApiKey] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balanceSats, setBalanceSats] = useState<number | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)

  useEffect(() => {
    if (phase !== 'detecting') return
    const t = setTimeout(() => setPhase('manual'), 1800)
    return () => clearTimeout(t)
  }, [phase])

  async function submit() {
    if (!apiKey.trim()) return
    setError(null)
    setPhase('connecting')
    try {
      const res = await api.connectBlink(token, apiKey.trim())
      const bal = await api.getWalletBalance(token, res.walletConnId)
      setBalanceSats(bal.balanceSats)
      setNickname(bal.nickname ?? res.nickname ?? 'Blink')
      setPhase('success')
      setTimeout(() => onDone(res.walletConnId), 1600)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection failed'
      setError(msg)
      setPhase('error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING}
      className="fixed inset-0 bg-bg flex flex-col"
    >
      <div className="pt-16 px-5">
        <button
          onClick={onBack}
          className="font-text text-15 text-white/50 hover:text-white/70 flex items-center gap-1 transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" /> Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <Glass radius="card" className="w-full max-w-md p-6 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING}
            className="w-16 h-16 rounded-glass mb-5 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Bolt size={32} className="text-white" />
          </motion.div>

          <h2 className="font-display font-semibold text-22 text-white text-center">
            Connect Blink
          </h2>

          <div className="w-full mt-6">
            <AnimatePresence mode="wait">
              {phase === 'detecting' && (
                <motion.div
                  key="detecting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-4"
                >
                  <p className="font-text text-14 text-white/55">Looking for an existing session…</p>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-white/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {(phase === 'manual' || phase === 'connecting' || phase === 'error') && (
                <motion.div
                  key="manual"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={SPRING}
                  className="flex flex-col gap-4"
                >
                  <p className="font-text text-14 text-white/55 text-center">
                    Paste your Blink API key to connect.
                  </p>
                  <div className="relative">
                    <input
                      type={reveal ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="blink_api_key_…"
                      disabled={phase === 'connecting'}
                      autoFocus
                      className="w-full h-12 px-4 pr-11 rounded-glass bg-white/[0.06] border border-white/15
                                 font-mono text-14 text-white placeholder:text-white/25
                                 focus:outline-none focus:border-bitcoin/60 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setReveal((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    >
                      {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {error && (
                    <p className="font-text text-13 text-negative text-center">{error}</p>
                  )}
                  <button
                    onClick={onHelp}
                    className="font-text text-13 text-bitcoin hover:opacity-80 transition-opacity"
                  >
                    Where do I find my API key?
                  </button>
                  <PillButton
                    onClick={submit}
                    disabled={!apiKey.trim() || phase === 'connecting'}
                  >
                    {phase === 'connecting' ? 'Connecting…' : 'Connect'}
                  </PillButton>
                </motion.div>
              )}

              {phase === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={SPRING}
                  className="flex flex-col items-center gap-3 py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 260 }}
                    className="w-14 h-14 rounded-full bg-positive/15 flex items-center justify-center"
                  >
                    <Check size={28} className="text-positive" />
                  </motion.div>
                  <p className="font-display font-semibold text-18 text-white">
                    {nickname ?? 'Blink'} connected
                  </p>
                  {balanceSats !== null && (
                    <p className="font-mono text-22 text-bitcoin tabular">
                      {balanceSats.toLocaleString()} sats
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Glass>
      </div>
    </motion.div>
  )
}
