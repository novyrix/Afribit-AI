import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Menu } from './ui/Icons'
import { Sidebar } from './main/Sidebar'
import { PortfolioCard } from './main/PortfolioCard'
import { ToolStrip } from './main/ToolStrip'
import { OrbBar, type ChatMessage } from './main/OrbBar'
import { api, type WalletConnection } from '../lib/api'

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 220 }

type Msg = ChatMessage & { id: string; pending?: boolean }

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function MainScreen({
  token, onAddWallet,
}: {
  token: string
  onAddWallet: () => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [wallets, setWallets] = useState<WalletConnection[]>([])
  const [messages, setMessages] = useState<Msg[]>([])
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const orbZoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    api.listWallets(token)
      .then(({ wallets }) => { if (!cancelled) setWallets(wallets) })
      .catch(() => { /* noop */ })
    return () => { cancelled = true }
  }, [token])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, thinking])

  // iOS keyboard adjustment
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    function onResize() {
      const kb = window.innerHeight - (vv?.height ?? window.innerHeight)
      if (orbZoneRef.current) {
        orbZoneRef.current.style.paddingBottom = kb > 0 ? `${kb + 20}px` : ''
      }
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  function onIncoming(m: ChatMessage) {
    const id = genId()
    setMessages((prev) => [...prev, { ...m, id }])
    if (m.role === 'user') setThinking(true)
    else setThinking(false)
  }

  function onSendError() {
    setThinking(false)
  }

  function deleteMessage(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  const connectedIds = wallets.map((w) => w.walletType)

  return (
    <div className="app-root absolute inset-0 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-5 pt-10 pb-2">
        <motion.button
          onClick={() => setSidebarOpen(true)}
          whileTap={{ scale: 0.92, rotate: 90 }}
          transition={{ type: 'spring', damping: 18, stiffness: 280 }}
          className="w-11 h-11 flex items-center justify-center
                     text-white/65 hover:text-white transition-colors"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </motion.button>
        <div />
      </header>

      <main
        ref={scrollRef}
        className="display-zone flex-1 overflow-y-auto overflow-x-hidden px-4 pb-3 flex flex-col gap-4"
        style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}
      >
        <PortfolioCard token={token} />

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={SPRING}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <button
                onClick={() => deleteMessage(m.id)}
                onContextMenu={(e) => { e.preventDefault(); deleteMessage(m.id) }}
                className={`${m.role === 'user' ? 'msg-user max-w-[82%]' : 'msg-ai max-w-[92%]'} font-ui text-15 text-left`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                title="Long-press or right-click to delete"
              >
                {m.text}
              </button>
            </motion.div>
          ))}

          {thinking && (
            <motion.div
              key="thinking"
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="flex justify-start"
            >
              <div className="msg-ai max-w-[92%] w-[280px]">
                <div className="font-ui text-10 text-bitcoin mb-2 tracking-wider uppercase">
                  SATS AI
                </div>
                <div className="flex flex-col gap-2">
                  <div className="shimmer-line" style={{ width: '80%' }} />
                  <div className="shimmer-line" style={{ width: '65%' }} />
                  <div className="shimmer-line" style={{ width: '90%' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="flex-shrink-0 px-2">
        <ToolStrip connectedIds={connectedIds} />
      </div>

      <div ref={orbZoneRef} className="orb-zone flex-shrink-0 px-4 pb-6 pt-3">
        <OrbBar
          token={token}
          thinking={thinking}
          onMessage={onIncoming}
          onError={onSendError}
        />
      </div>

      <Sidebar
        token={token}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddWallet={onAddWallet}
      />
    </div>
  )
}
