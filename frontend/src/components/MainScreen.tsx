import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Menu } from './ui/Icons'
import { Sidebar, type SidebarView } from './main/Sidebar'
import { PortfolioCard } from './main/PortfolioCard'
import { ToolStrip } from './main/ToolStrip'
import { OrbBar, type ChatMessage } from './main/OrbBar'
import { HistoryPage } from './pages/HistoryPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AccountPage } from './pages/AccountPage'
import { SettingsPage } from './pages/SettingsPage'
import { SecurityPage } from './pages/SecurityPage'
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
  const [view, setView] = useState<SidebarView>('home')
  const [wallets, setWallets] = useState<WalletConnection[]>([])
  const [messages, setMessages] = useState<Msg[]>([])
  const [thinking, setThinking] = useState(false)
  const [chatMode, setChatMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const orbZoneRef = useRef<HTMLDivElement>(null)
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // 9-second inactivity returns to the dashboard
  function bumpIdle() {
    if (idleRef.current) clearTimeout(idleRef.current)
    idleRef.current = setTimeout(() => setChatMode(false), 9000)
  }
  function enterChatMode() {
    setChatMode(true)
    bumpIdle()
  }
  function exitChatMode() {
    if (idleRef.current) clearTimeout(idleRef.current)
    setChatMode(false)
  }
  useEffect(() => () => { if (idleRef.current) clearTimeout(idleRef.current) }, [])

  function onIncoming(m: ChatMessage) {
    const id = genId()
    setMessages((prev) => [...prev, { ...m, id }])
    if (m.role === 'user') setThinking(true)
    else setThinking(false)
    enterChatMode()
  }

  function onSendError() {
    setThinking(false)
  }

  function deleteMessage(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  function navigate(next: SidebarView) {
    setView(next)
    setSidebarOpen(false)
    if (next === 'home') exitChatMode()
  }

  const connectedIds = wallets.map((w) => w.walletType)

  return (
    <div className="app-root absolute inset-0 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'history' && <HistoryPage key="history" token={token} onBack={() => navigate('home')} />}
        {view === 'analytics' && <AnalyticsPage key="analytics" token={token} onBack={() => navigate('home')} />}
        {view === 'account' && <AccountPage key="account" token={token} onBack={() => navigate('home')} />}
        {view === 'settings' && <SettingsPage key="settings" onBack={() => navigate('home')} />}
        {view === 'security' && <SecurityPage key="security" onBack={() => navigate('home')} />}
      </AnimatePresence>

      {view === 'home' && (
        <>
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
        <AnimatePresence>
          {chatMode && (
            <motion.button
              key="exit-chat"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={exitChatMode}
              className="w-9 h-9 rounded-full flex items-center justify-center
                         text-white/60 hover:text-white bg-white/5 border border-white/10"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Back to dashboard"
            >
              <span className="text-18 leading-none">×</span>
            </motion.button>
          )}
        </AnimatePresence>
      </header>

      <main
        ref={scrollRef}
        onScroll={() => {
          if (chatMode && scrollRef.current && scrollRef.current.scrollTop < 4) exitChatMode()
        }}
        className="display-zone flex-1 overflow-y-auto overflow-x-hidden px-4 pb-3 flex flex-col gap-4"
        style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}
      >
        <motion.div
          initial={false}
          animate={{
            height: chatMode ? 0 : 'auto',
            opacity: chatMode ? 0 : 1,
            marginBottom: chatMode ? -16 : 0,
          }}
          transition={SPRING}
          style={{ overflow: 'hidden' }}
        >
          <PortfolioCard token={token} />
        </motion.div>

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
          onActivity={() => { if (chatMode) bumpIdle() }}
        />
      </div>
        </>
      )}

      <Sidebar
        token={token}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddWallet={onAddWallet}
        currentView={view}
        onNavigate={navigate}
      />
    </div>
  )
}
