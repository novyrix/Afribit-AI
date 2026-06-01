import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { api, TOKEN_KEY, type Language } from './lib/api'
import { LaunchScreen } from './components/LaunchScreen'
import { WalletSelection } from './components/WalletSelection'
import { BlinkConnect } from './components/BlinkConnect'
import { FediConnect } from './components/FediConnect'
import { HelpSheet } from './components/HelpSheet'
import { MainScreen } from './components/MainScreen'

type Phase = 'launch' | 'select' | 'connectBlink' | 'connectFedi' | 'main'

const LANG_KEY = 'sats_lang'
const PHASE_KEY = 'sats_phase'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY))
  const [language] = useState<Language>(
    (localStorage.getItem(LANG_KEY) as Language) || 'en'
  )
  const [phase, setPhase] = useState<Phase>(
    (localStorage.getItem(PHASE_KEY) as Phase) || 'launch'
  )
  const [helpFor, setHelpFor] = useState<'blink' | 'fedi' | null>(null)
  const [hasBlink, setHasBlink] = useState(false)
  const [hasFedi, setHasFedi] = useState(false)
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
    if (!token) return
    api.listWallets(token)
      .then(({ wallets }) => {
        setHasBlink(wallets.some((w) => w.walletType === 'blink'))
        setHasFedi(wallets.some((w) => w.walletType === 'fedi'))
        if (wallets.length > 0 && phase === 'launch') {
          setPhase('main')
          localStorage.setItem(PHASE_KEY, 'main')
        }
      })
      .catch(() => { /* noop */ })
  }, [token, phase])

  function go(next: Phase) {
    setPhase(next)
    localStorage.setItem(PHASE_KEY, next)
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] glass-pill px-4 py-2
                        font-text text-13 text-negative max-w-[90vw]">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'launch' && (
          <LaunchScreen key="launch" onContinue={() => go('select')} />
        )}

        {phase === 'select' && token && (
          <WalletSelection
            key="select"
            hasBlink={hasBlink}
            hasFedi={hasFedi}
            onSelectBlink={() => go('connectBlink')}
            onSelectFedi={() => go('connectFedi')}
            onSkip={() => go('main')}
          />
        )}

        {phase === 'connectBlink' && token && (
          <BlinkConnect
            key="blink"
            token={token}
            onBack={() => go('select')}
            onHelp={() => setHelpFor('blink')}
            onDone={() => { setHasBlink(true); go('main') }}
          />
        )}

        {phase === 'connectFedi' && token && (
          <FediConnect
            key="fedi"
            token={token}
            onBack={() => go('select')}
            onHelp={() => setHelpFor('fedi')}
            onDone={() => { setHasFedi(true); go('main') }}
          />
        )}

        {phase === 'main' && token && (
          <MainScreen
            key="main"
            token={token}
            onAddWallet={() => go('select')}
          />
        )}
      </AnimatePresence>

      <HelpSheet
        variant={helpFor ?? 'blink'}
        open={helpFor !== null}
        onClose={() => setHelpFor(null)}
      />
    </div>
  )
}
