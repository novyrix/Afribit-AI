import { useState } from 'react'
import { motion } from 'framer-motion'
import { inflationApi, type InflationUser } from '../lib/api'
import { Glass, PillButton } from '../../components/ui/Glass'

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 220 }
const ROLES = [
  { value: 'household',       label: 'Household member' },
  { value: 'merchant',        label: 'Merchant' },
  { value: 'field-officer',   label: 'Field officer' },
  { value: 'community-admin', label: 'Community admin' },
]

type Mode = 'login' | 'register'

export function LoginScreen({ onAuth }: { onAuth: (token: string, user: InflationUser) => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [role, setRole] = useState('household')

  async function submit() {
    setError(null)
    setLoading(true)
    try {
      if (mode === 'register') {
        const { token, user } = await inflationApi.register({
          display_name: displayName.trim(),
          role,
          phone: phone.trim() || undefined,
          pin,
          consent_given: false,
        })
        onAuth(token, user)
      } else {
        const { token, user } = await inflationApi.login({
          display_name: displayName.trim() || undefined,
          phone: phone.trim() || undefined,
          pin,
        })
        onAuth(token, user)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING}
      className="fixed inset-0 flex flex-col items-center justify-center px-5"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-ui text-11 text-white/35 tracking-wider uppercase mb-2">Sats Cost of Living Index</div>
          <h1 className="font-brand font-semibold text-26 text-white">
            {mode === 'register' ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="font-text text-14 text-white/50 mt-1">
            {mode === 'register' ? 'Join the Kibera price tracker' : 'Sign in to continue'}
          </p>
        </div>

        <Glass radius="card" className="p-5 flex flex-col gap-4">
          {mode === 'register' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name (e.g. Aisha K)"
              className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                         font-text text-14 text-white placeholder:text-white/25
                         focus:outline-none focus:border-bitcoin/60 transition-colors"
            />
          )}

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={mode === 'register' ? 'Phone (optional)' : 'Phone or display name'}
            className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                       font-text text-14 text-white placeholder:text-white/25
                       focus:outline-none focus:border-bitcoin/60 transition-colors"
          />

          {mode === 'login' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Or display name"
              className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                         font-text text-14 text-white placeholder:text-white/25
                         focus:outline-none focus:border-bitcoin/60 transition-colors"
            />
          )}

          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN (4+ digits)"
            className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                       font-mono text-14 text-white placeholder:text-white/25
                       focus:outline-none focus:border-bitcoin/60 transition-colors"
          />

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className="h-10 rounded-glass font-text text-13 transition-all"
                  style={{
                    background: role === r.value ? 'rgba(247,147,26,0.18)' : 'rgba(255,255,255,0.05)',
                    border: role === r.value ? '1px solid rgba(247,147,26,0.55)' : '1px solid rgba(255,255,255,0.10)',
                    color: role === r.value ? '#F7931A' : 'rgba(255,255,255,0.60)',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {error && <p className="font-text text-13 text-negative text-center">{error}</p>}

          <PillButton onClick={submit} disabled={loading || pin.length < 4}>
            {loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
          </PillButton>
        </Glass>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          className="mt-4 w-full font-text text-14 text-white/45 hover:text-white/70 transition-colors text-center"
        >
          {mode === 'login' ? 'No account? Register' : 'Already registered? Sign in'}
        </button>
      </div>
    </motion.div>
  )
}
