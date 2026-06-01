import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Plus } from './ui/Icons'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const IOS_DISMISS_KEY = 'sats_ios_install_dismissed_at'
const ANDROID_DISMISS_KEY = 'sats_android_install_dismissed_at'
const THREE_DAYS = 1000 * 60 * 60 * 24 * 3

function recentlyDismissed(key: string) {
  const v = localStorage.getItem(key)
  if (!v) return false
  const t = parseInt(v, 10)
  return !isNaN(t) && Date.now() - t < THREE_DAYS
}

export function InstallPrompts({ trigger }: { trigger: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIos, setShowIos] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setShowAndroid(false)
      setShowIos(false)
      setDeferred(null)
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!trigger) return
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    if (standalone) return

    if (deferred && !recentlyDismissed(ANDROID_DISMISS_KEY)) {
      setShowAndroid(true)
      return
    }
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS && !recentlyDismissed(IOS_DISMISS_KEY)) {
      setShowIos(true)
    }
  }, [trigger, deferred])

  async function installAndroid() {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'dismissed') {
      localStorage.setItem(ANDROID_DISMISS_KEY, String(Date.now()))
    }
    setShowAndroid(false)
    setDeferred(null)
  }

  function dismissAndroid() {
    localStorage.setItem(ANDROID_DISMISS_KEY, String(Date.now()))
    setShowAndroid(false)
  }

  function dismissIos() {
    localStorage.setItem(IOS_DISMISS_KEY, String(Date.now()))
    setShowIos(false)
  }

  return (
    <>
      <AnimatePresence>
        {showAndroid && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed top-3 left-3 right-3 z-[80] glass-pill px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-bitcoin/20 border border-bitcoin/40 flex items-center justify-center">
              <Plus size={16} className="text-bitcoin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-ui font-semibold text-13 text-white">Install Afribit SATS</div>
              <div className="font-ui text-12 text-white/55">Add to your home screen for quick access</div>
            </div>
            <button
              onClick={installAndroid}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-bitcoin text-black font-ui font-semibold text-13"
            >
              Install
            </button>
            <button
              onClick={dismissAndroid}
              aria-label="Dismiss"
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/55 hover:text-white"
            >
              <span className="text-15 leading-none">×</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIos && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissIos}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed left-0 right-0 bottom-0 z-[80] glass rounded-t-[28px] px-6 pt-3 pb-8"
              style={{ maxHeight: '60vh' }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-white/25" />
              </div>
              <h3 className="font-brand font-semibold text-20 text-white">
                Sakinisha programu hii
              </h3>
              <p className="font-ui text-14 text-white/60 mt-1">Install Afribit SATS on your home screen</p>

              <ol className="mt-5 flex flex-col gap-3.5">
                <Step n={1}>Tap the Share icon in Safari's bottom bar</Step>
                <Step n={2}>Scroll down and tap "Add to Home Screen"</Step>
                <Step n={3}>Tap Add to confirm</Step>
              </ol>

              <a
                href="https://support.apple.com/guide/iphone/bookmark-favorite-webpages-iph42ab2f3a7/ios"
                target="_blank"
                rel="noreferrer noopener"
                className="mt-5 inline-flex items-center gap-1 font-ui text-14 text-bitcoin"
              >
                Need help?
                <ArrowUpRight size={14} />
              </a>

              <div className="mt-6">
                <button
                  onClick={dismissIos}
                  className="w-full glass-pill h-12 font-ui font-semibold text-15 text-white"
                >
                  Remind me later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/20
                       flex items-center justify-center font-numbers text-13 text-white/75">
        {n}
      </span>
      <span className="font-ui text-15 text-white/80 leading-snug">{children}</span>
    </li>
  )
}
