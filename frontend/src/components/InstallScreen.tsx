import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Plus, ChevronRight } from './ui/Icons'
import {
  getDeferredInstallPrompt,
  clearDeferredInstallPrompt,
  isStandalone,
  isIOSDevice,
} from '../lib/pwa'

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 220 }

export function InstallScreen({ onContinue }: { onContinue: () => void }) {
  const [deferred, setDeferred] = useState(getDeferredInstallPrompt())
  const [installing, setInstalling] = useState(false)
  const standalone = isStandalone()
  const ios = isIOSDevice()

  useEffect(() => {
    function onReady() { setDeferred(getDeferredInstallPrompt()) }
    window.addEventListener('sats-install-ready', onReady)
    window.addEventListener('appinstalled', onContinue)
    return () => {
      window.removeEventListener('sats-install-ready', onReady)
      window.removeEventListener('appinstalled', onContinue)
    }
  }, [onContinue])

  async function handleInstall() {
    const p = getDeferredInstallPrompt()
    if (!p) return
    setInstalling(true)
    try {
      p.prompt()
      const { outcome } = await p.userChoice
      clearDeferredInstallPrompt()
      setDeferred(null)
      if (outcome === 'accepted') onContinue()
    } finally {
      setInstalling(false)
    }
  }

  if (standalone) {
    // Already installed — skip immediately
    setTimeout(onContinue, 0)
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING}
      className="absolute inset-0 flex flex-col px-5"
    >
      <div className="pt-[14vh]">
        <div className="font-ui text-12 text-white/35 tracking-wider uppercase">
          Step 1 of 2
        </div>
        <h1 className="font-brand font-semibold text-28 text-white mt-3">
          Install Afribit SATS
        </h1>
        <p className="font-ui text-15 text-white/55 mt-2 leading-relaxed">
          Add it to your home screen for the best experience.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Pill>Works offline</Pill>
          <Pill>Instant open</Pill>
          <Pill>No app store</Pill>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center mt-4">
        {ios ? (
          <IosInstructions />
        ) : deferred ? (
          <AndroidInstall onInstall={handleInstall} installing={installing} />
        ) : (
          <DesktopFallback />
        )}
      </div>

      <div className="pb-8 flex flex-col items-center gap-3">
        <button
          onClick={onContinue}
          className="font-ui text-14 text-white/45 hover:text-white/70 transition-colors
                     flex items-center gap-1"
        >
          I'll do this later
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="glass-pill px-3 py-1.5 font-ui text-12 text-white/60">
      {children}
    </span>
  )
}

function AndroidInstall({ onInstall, installing }: { onInstall: () => void; installing: boolean }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-24 h-24 rounded-3xl bg-bitcoin/15 border border-bitcoin/35
                      flex items-center justify-center">
        <Plus size={36} className="text-bitcoin" />
      </div>
      <button
        onClick={onInstall}
        disabled={installing}
        className="glass-pill h-14 px-8 font-ui font-semibold text-16 text-white
                   disabled:opacity-50"
        style={{ background: 'rgba(247,147,26,0.18)', borderColor: 'rgba(247,147,26,0.55)' }}
      >
        {installing ? 'Installing…' : 'Add to Home Screen'}
      </button>
      <p className="font-ui text-12 text-white/40 text-center max-w-xs">
        Your phone will ask to confirm. Tap "Install" on the system dialog.
      </p>
    </div>
  )
}

function IosInstructions() {
  return (
    <div className="flex flex-col gap-4">
      <Step n={1} text="Tap the Share icon in Safari's bottom bar" />
      <Step n={2} text='Scroll down and tap "Add to Home Screen"' />
      <Step n={3} text='Tap "Add" to confirm' />
      <a
        href="https://support.apple.com/guide/iphone/bookmark-favorite-webpages-iph42ab2f3a7/ios"
        target="_blank"
        rel="noreferrer noopener"
        className="mt-3 inline-flex items-center gap-1 font-ui text-14 text-bitcoin self-start"
      >
        Need help with Safari?
        <ArrowUpRight size={14} />
      </a>
    </div>
  )
}

function DesktopFallback() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/15
                      flex items-center justify-center">
        <Plus size={28} className="text-white/60" />
      </div>
      <p className="font-ui text-14 text-white/55 max-w-xs">
        To install, open this page on your phone, or use your browser's "Install app" option.
      </p>
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 border border-white/20
                       flex items-center justify-center font-numbers text-13 text-white/75">
        {n}
      </span>
      <span className="font-ui text-15 text-white/80 leading-snug pt-0.5">{text}</span>
    </div>
  )
}
