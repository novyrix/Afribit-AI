import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { ChevronRight } from '../components/ui/Icons'
import {
  takaApi, TAKA_TOKEN_KEY, TAKA_ROLE_KEY, type TakaRole, type IdentifyResult,
} from './lib/api'
import { CollectorView } from './CollectorView'
import { SupervisorView } from './SupervisorView'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'user' }
  | { kind: 'collector'; token: string }
  | { kind: 'supervisor'; token: string }

export function TakaSatsProgram({
  token, onBack, onHome,
}: {
  token: string
  onBack: () => void
  onHome: () => void
}) {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function detect() {
      const cachedToken = localStorage.getItem(TAKA_TOKEN_KEY)
      const cachedRole = localStorage.getItem(TAKA_ROLE_KEY) as TakaRole | null
      if (cachedToken && (cachedRole === 'collector' || cachedRole === 'supervisor')) {
        setState({ kind: cachedRole, token: cachedToken })
        return
      }

      try {
        const { wallets } = await api.listWallets(token)
        const wallet = wallets.find((w) => w.walletType === 'fedi')
          ?? wallets.find((w) => w.walletType === 'blink')
        if (!wallet || !wallet.externalId) {
          if (!cancelled) setState({ kind: 'user' })
          return
        }
        const walletType = wallet.walletType === 'blink' ? 'blink' : 'fedi'
        const result: IdentifyResult = await takaApi.identify({
          wallet_type: walletType,
          member_key: wallet.externalId,
          wallet_address: wallet.externalId,
        })
        if (cancelled) return
        if (result.role === 'user') {
          setState({ kind: 'user' })
        } else {
          localStorage.setItem(TAKA_TOKEN_KEY, result.token)
          localStorage.setItem(TAKA_ROLE_KEY, result.role)
          setState({ kind: result.role, token: result.token })
        }
      } catch (e) {
        if (!cancelled) setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not load Taka Sats' })
      }
    }

    detect()
    return () => { cancelled = true }
  }, [token])

  if (state.kind === 'collector') {
    return <CollectorView token={state.token} onBack={onBack} onHome={onHome} />
  }
  if (state.kind === 'supervisor') {
    return <SupervisorView token={state.token} onHome={onHome} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="absolute inset-0 flex flex-col px-5"
    >
      <div className="pt-[10vh]">
        <button
          onClick={onBack}
          className="font-ui text-13 text-white/45 hover:text-white/70 flex items-center gap-1 mb-4"
        >
          <ChevronRight size={14} className="rotate-180" />
          Programs
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#00C896' }} />
          <h1 className="font-brand font-semibold text-26 text-white">Taka Sats</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {state.kind === 'loading' && (
          <div className="font-ui text-14 text-white/45">Checking your membership…</div>
        )}

        {state.kind === 'error' && (
          <div className="glass rounded-card p-5 text-center max-w-sm">
            <div className="font-ui text-14 text-negative">{state.message}</div>
          </div>
        )}

        {state.kind === 'user' && (
          <div className="glass rounded-card p-6 max-w-sm">
            <div className="font-brand font-semibold text-20 text-white">Turn waste into Bitcoin</div>
            <p className="font-ui text-14 text-white/60 leading-relaxed mt-3">
              Taka Sats rewards waste collectors in Kibera with sats for every kilogram they bring
              to a collection point. Members get a verified QR card and are paid instantly.
            </p>
            <p className="font-ui text-14 text-white/60 leading-relaxed mt-3">
              You are not registered yet. Enrolment happens in person with an Afribit supervisor,
              who will link your wallet and issue your card.
            </p>
            <div
              className="mt-5 rounded-glass px-4 py-3 font-ui text-13 text-white/70"
              style={{ background: 'rgba(0,200,150,0.10)', border: '1px solid rgba(0,200,150,0.35)' }}
            >
              Ask an Afribit supervisor to enrol you, then reconnect this wallet.
            </div>
            <button
              onClick={onHome}
              className="w-full mt-5 font-ui text-14 text-white/50 hover:text-white/80 flex items-center justify-center gap-1"
            >
              Go to SATS
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
