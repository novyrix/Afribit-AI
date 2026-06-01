import { useState } from 'react'
import { PageShell, SectionLabel } from './PageShell'
import { Shield, Check } from '../ui/Icons'

export function SecurityPage({ onBack }: { onBack: () => void }) {
  const [appLock, setAppLock] = useState(localStorage.getItem('sats_app_lock') === 'on')
  const webAuthn = typeof window !== 'undefined' && 'PublicKeyCredential' in window

  function toggleLock() {
    const v = !appLock
    setAppLock(v)
    localStorage.setItem('sats_app_lock', v ? 'on' : 'off')
  }

  return (
    <PageShell title="Security" onBack={onBack}>
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex gap-3 mt-1">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
             style={{ background: 'rgba(247,147,26,0.12)' }}>
          <Shield size={20} className="text-bitcoin" />
        </div>
        <div>
          <div className="font-brand text-15 text-white">Your keys stay yours</div>
          <p className="font-ui text-12 text-white/50 mt-1 leading-relaxed">
            Afribit SATS never holds your funds. Wallet credentials are stored in an
            encrypted server session tied only to this device's token.
          </p>
        </div>
      </div>

      <SectionLabel>How your data is protected</SectionLabel>
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
        <Fact text="Session token stored locally on this device" />
        <Fact text="Wallet API keys encrypted at rest" />
        <Fact text="Read-only access — funds can never be moved" />
        <Fact text="No data sold or shared with advertisers" />
      </div>

      <SectionLabel>App protection</SectionLabel>
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <div className="font-ui text-14 text-white/85">Require unlock</div>
            <div className="font-ui text-12 text-white/40 mt-0.5">
              {webAuthn ? 'Ask for device authentication on open' : 'Not available on this device'}
            </div>
          </div>
          <button
            onClick={toggleLock}
            disabled={!webAuthn}
            className="w-11 h-6 rounded-full p-0.5 transition-colors flex disabled:opacity-40"
            style={{ background: appLock ? '#F7931A' : 'rgba(255,255,255,0.15)' }}
            aria-label="Require unlock"
          >
            <span className="w-5 h-5 rounded-full bg-white transition-transform"
                  style={{ transform: appLock ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>
      </div>

      <p className="font-ui text-12 text-white/30 text-center mt-6">
        Afribit Africa · afribit.africa
      </p>
    </PageShell>
  )
}

function Fact({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] last:border-b-0">
      <Check size={16} className="text-positive flex-shrink-0" />
      <span className="font-ui text-13 text-white/70">{text}</span>
    </div>
  )
}
