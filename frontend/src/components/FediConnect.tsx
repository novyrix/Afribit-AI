import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { FediMark, Check, ChevronRight } from './ui/Icons'
import { Glass, PillButton } from './ui/Glass'
import { api } from '../lib/api'
import { enableWebln, getWeblnBalanceSats, listWeblnTransactions } from '../lib/webln'
import { isInFedi, readFediFederation } from '../lib/fedi'

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 220 }

type Phase = 'input' | 'connecting' | 'success' | 'error'

export function FediConnect({
  token, onBack, onHelp, onDone,
}: {
  token: string
  onBack: () => void
  onHelp: () => void
  onDone: (walletConnId: string) => void
}) {
  const inFedi = isInFedi()
  const [phase, setPhase] = useState<Phase>('input')
  const [manual, setManual] = useState(!inFedi)
  const [federationId, setFederationId] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)

  async function connectInFedi() {
    setError(null)
    setPhase('connecting')
    try {
      const info = await enableWebln()
      const fed = await readFediFederation()
      const name = fed.name?.trim() || info.alias?.trim() || 'Fedi Wallet'
      const fedId = fed.id?.trim() || info.pubkey?.trim() || 'fedi-mini-app'
      setNickname(name)

      const conn = await api.connectFedi(token, fedId, undefined, name)

      const bal = await getWeblnBalanceSats()
      if (bal !== null) {
        try { await api.setWalletBalance(token, 'fedi', conn.walletConnId, bal) }
        catch { /* balance is best-effort */ }
      }

      const txs = await listWeblnTransactions(100)
      if (txs.length > 0) {
        try { await api.pushFediTransactions(token, conn.walletConnId, txs) }
        catch { /* tx import is best-effort */ }
      }

      setPhase('success')
      setTimeout(() => onDone(conn.walletConnId), 1400)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection failed'
      setError(msg)
      setPhase('error')
    }
  }

  async function submit() {
    if (!federationId.trim()) return
    setError(null)
    setPhase('connecting')
    try {
      const res = await api.connectFedi(token, federationId.trim(), inviteCode.trim() || undefined)
      setNickname(federationId.trim().slice(0, 12))
      setPhase('success')
      setTimeout(() => onDone(res.walletConnId), 1400)
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
            <FediMark size={32} className="text-white" />
          </motion.div>

          <h2 className="font-display font-semibold text-22 text-white text-center">
            Connect Fedi
          </h2>

          <div className="w-full mt-6">
            <AnimatePresence mode="wait">
              {(phase === 'input' || phase === 'connecting' || phase === 'error') && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={SPRING}
                  className="flex flex-col gap-3"
                >
                  {inFedi && !manual ? (
                    <>
                      <p className="font-text text-14 text-white/55 text-center">
                        Link the wallet on this device. Fedi will ask you to allow access.
                      </p>
                      {error && (
                        <p className="font-text text-13 text-negative text-center">{error}</p>
                      )}
                      <PillButton
                        onClick={connectInFedi}
                        disabled={phase === 'connecting'}
                      >
                        {phase === 'connecting' ? 'Connecting…' : 'Connect wallet'}
                      </PillButton>
                      <button
                        onClick={() => { setError(null); setManual(true) }}
                        className="font-text text-13 text-white/45 hover:text-white/70 transition-colors"
                      >
                        Enter federation details instead
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-text text-14 text-white/55 text-center">
                        Enter your federation details.
                      </p>
                      <input
                        type="text"
                        value={federationId}
                        onChange={(e) => setFederationId(e.target.value)}
                        placeholder="Federation ID"
                        disabled={phase === 'connecting'}
                        autoFocus
                        className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                                   font-mono text-14 text-white placeholder:text-white/25
                                   focus:outline-none focus:border-bitcoin/60 transition-colors"
                      />
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Invite code (optional, fed1…)"
                        disabled={phase === 'connecting'}
                        className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                                   font-mono text-14 text-white placeholder:text-white/25
                                   focus:outline-none focus:border-bitcoin/60 transition-colors"
                      />
                      {error && (
                        <p className="font-text text-13 text-negative text-center">{error}</p>
                      )}
                      <button
                        onClick={onHelp}
                        className="font-text text-13 text-bitcoin hover:opacity-80 transition-opacity"
                      >
                        How do I find these?
                      </button>
                      <PillButton
                        onClick={submit}
                        disabled={!federationId.trim() || phase === 'connecting'}
                      >
                        {phase === 'connecting' ? 'Connecting…' : 'Connect'}
                      </PillButton>
                      {inFedi && (
                        <button
                          onClick={() => { setError(null); setManual(false) }}
                          className="font-text text-13 text-white/45 hover:text-white/70 transition-colors"
                        >
                          Use this device's wallet instead
                        </button>
                      )}
                    </>
                  )}
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
                    Federation linked
                  </p>
                  {nickname && (
                    <p className="font-mono text-13 text-white/55 tabular">{nickname}…</p>
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
