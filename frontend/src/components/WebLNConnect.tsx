import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Bolt, Check, ChevronRight } from './ui/Icons'
import { Glass, PillButton } from './ui/Glass'
import { api } from '../lib/api'
import { enableWebln, getWeblnBalanceSats, listWeblnTransactions } from '../lib/webln'

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 220 }

type Phase = 'connecting' | 'success' | 'error'

export function WebLNConnect({
  token, onBack, onDone,
}: {
  token: string
  onBack: () => void
  onDone: (walletConnId: string) => void
}) {
  const [phase, setPhase] = useState<Phase>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [balanceSats, setBalanceSats] = useState<number | null>(null)
  const [nickname, setNickname] = useState<string>('Lightning Wallet')
  const [txCount, setTxCount] = useState(0)
  const started = useRef(false)

  async function run() {
    setError(null)
    setPhase('connecting')
    try {
      const info = await enableWebln()
      const name = info.alias?.trim() || 'Lightning Wallet'
      setNickname(name)

      const conn = await api.connectWebln(token, info.pubkey, name)

      const bal = await getWeblnBalanceSats()
      if (bal !== null) setBalanceSats(bal)

      const txs = await listWeblnTransactions(100)
      if (txs.length > 0) {
        try {
          const pushed = await api.pushWeblnTransactions(token, conn.walletConnId, txs)
          setTxCount(pushed.inserted)
        } catch {
          /* connection still succeeds even if tx push fails */
        }
      }

      setPhase('success')
      setTimeout(() => onDone(conn.walletConnId), 1600)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection failed'
      setError(msg)
      setPhase('error')
    }
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            <Bolt size={32} className="text-bitcoin" />
          </motion.div>

          <h2 className="font-display font-semibold text-22 text-white text-center">
            Instant connect
          </h2>

          <div className="w-full mt-6">
            {phase === 'connecting' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="font-text text-14 text-white/55 text-center">
                  Authorising with your wallet…
                </p>
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
              </div>
            )}

            {phase === 'error' && (
              <div className="flex flex-col gap-4">
                <p className="font-text text-13 text-negative text-center">{error}</p>
                <p className="font-text text-13 text-white/45 text-center">
                  Approve the request in your wallet, then try again.
                </p>
                <PillButton onClick={run}>Try again</PillButton>
              </div>
            )}

            {phase === 'success' && (
              <motion.div
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
                  {nickname} connected
                </p>
                {balanceSats !== null && (
                  <p className="font-mono text-22 text-bitcoin tabular">
                    {balanceSats.toLocaleString()} sats
                  </p>
                )}
                {txCount > 0 && (
                  <p className="font-text text-13 text-white/45">
                    {txCount} transactions imported
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </Glass>
      </div>
    </motion.div>
  )
}
