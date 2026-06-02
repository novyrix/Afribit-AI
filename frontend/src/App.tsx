import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { api, TOKEN_KEY, type Language } from './lib/api'
import { LaunchScreen } from './components/LaunchScreen'
import { InstallScreen } from './components/InstallScreen'
import { EcosystemScreen } from './components/EcosystemScreen'
import { TermsScreen } from './components/TermsScreen'
import { AIPreferencesScreen } from './components/AIPreferencesScreen'
import { BlinkConnect } from './components/BlinkConnect'
import { FediConnect } from './components/FediConnect'
import { WebLNConnect } from './components/WebLNConnect'
import { NWCConnect } from './components/NWCConnect'
import { HelpSheet } from './components/HelpSheet'
import { MainScreen } from './components/MainScreen'
import { BgCanvas } from './components/ui/BgCanvas'
import { isStandalone } from './lib/pwa'
import { isWeblnAvailable } from './lib/webln'

type Phase =
  | 'launch' | 'install' | 'terms' | 'aiPrefs'
  | 'ecosystem' | 'connectBlink' | 'connectFedi' | 'connectWebln' | 'connectNwc' | 'main'

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
  const [weblnAvailable] = useState(isWeblnAvailable())
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
        if (wallets.length > 0 && (phase === 'launch' || phase === 'install' || phase === 'terms' || phase === 'aiPrefs' || phase === 'ecosystem')) {
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
    <div className="min-h-screen text-white">
      <BgCanvas />

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] glass-pill px-4 py-2
                        font-ui text-13 text-negative max-w-[90vw]">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'launch' && (
          <LaunchScreen
            key="launch"
            onContinue={() => go(isStandalone() ? 'terms' : 'install')}
          />
        )}

        {phase === 'install' && (
          <InstallScreen key="install" onContinue={() => go('terms')} />
        )}

        {phase === 'terms' && (
          <TermsScreen key="terms" onContinue={() => go('aiPrefs')} />
        )}

        {phase === 'aiPrefs' && (
          <AIPreferencesScreen key="aiPrefs" onContinue={() => go('ecosystem')} />
        )}

        {phase === 'ecosystem' && token && (
          <EcosystemScreen
            key="ecosystem"
            hasBlink={hasBlink}
            hasFedi={hasFedi}
            weblnAvailable={weblnAvailable}
            onSelectBlink={() => go('connectBlink')}
            onSelectFedi={() => go('connectFedi')}
            onSelectWebln={() => go('connectWebln')}
            onSelectNwc={() => go('connectNwc')}
            onSkip={() => go('main')}
          />
        )}

        {phase === 'connectBlink' && token && (
          <BlinkConnect
            key="blink"
            token={token}
            onBack={() => go('ecosystem')}
            onHelp={() => setHelpFor('blink')}
            onDone={() => { setHasBlink(true); go('main') }}
          />
        )}

        {phase === 'connectFedi' && token && (
          <FediConnect
            key="fedi"
            token={token}
            onBack={() => go('ecosystem')}
            onHelp={() => setHelpFor('fedi')}
            onDone={() => { setHasFedi(true); go('main') }}
          />
        )}

        {phase === 'connectWebln' && token && (
          <WebLNConnect
            key="webln"
            token={token}
            onBack={() => go('ecosystem')}
            onDone={() => { go('main') }}
          />
        )}

        {phase === 'connectNwc' && token && (
          <NWCConnect
            key="nwc"
            token={token}
            onBack={() => go('ecosystem')}
            onDone={() => { go('main') }}
          />
        )}

        {phase === 'main' && token && (
          <MainScreen
            key="main"
            token={token}
            onAddWallet={() => go('ecosystem')}
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
