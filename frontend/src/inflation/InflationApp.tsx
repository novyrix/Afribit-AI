import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { inflationApi, INFLATION_TOKEN_KEY, type InflationUser } from './lib/api'
import { BgCanvas } from '../components/ui/BgCanvas'
import { LoginScreen } from './screens/LoginScreen'
import { ConsentScreen } from './screens/ConsentScreen'
import { CaptureScreen } from './screens/CaptureScreen'

type Phase = 'loading' | 'auth' | 'consent' | 'capture'

export default function InflationApp() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(INFLATION_TOKEN_KEY))
  const [user, setUser] = useState<InflationUser | null>(null)

  useEffect(() => {
    if (!token) { setPhase('auth'); return }
    inflationApi.me(token)
      .then(({ user: u }) => {
        setUser(u)
        setPhase(u.consent_given ? 'capture' : 'consent')
      })
      .catch(() => {
        localStorage.removeItem(INFLATION_TOKEN_KEY)
        setToken(null)
        setPhase('auth')
      })
  }, [token])

  function onAuth(tok: string, u: InflationUser) {
    localStorage.setItem(INFLATION_TOKEN_KEY, tok)
    setToken(tok)
    setUser(u)
    setPhase(u.consent_given ? 'capture' : 'consent')
  }

  async function onConsent() {
    if (!token) return
    try { await inflationApi.recordConsent(token) } catch { /* noop */ }
    setUser((u) => u ? { ...u, consent_given: true } : u)
    setPhase('capture')
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <BgCanvas />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-bitcoin/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      <BgCanvas />
      <AnimatePresence mode="wait">
        {phase === 'auth' && (
          <LoginScreen key="auth" onAuth={onAuth} />
        )}
        {phase === 'consent' && token && user && (
          <ConsentScreen key="consent" onAccept={onConsent} />
        )}
        {phase === 'capture' && token && user && (
          <CaptureScreen key="capture" token={token} user={user} />
        )}
      </AnimatePresence>
    </div>
  )
}
