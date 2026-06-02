import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPendingCount, getPendingPurchases, clearSyncedPurchases } from '../lib/offline'
import { inflationApi } from '../lib/api'

export function SyncIndicator({ token }: { token: string }) {
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    getPendingCount().then(setPending).catch(() => setPending(0))

    function handleOnline() { setOnline(true) }
    function handleOffline() { setOnline(false) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function sync() {
    if (syncing || pending === 0) return
    setSyncing(true)
    try {
      const items = await getPendingPurchases()
      if (!items.length) { setSyncing(false); return }
      const result = await inflationApi.syncBatch(token, items)
      await clearSyncedPurchases(result.ids)
      setPending(await getPendingCount())
    } catch { /* will retry next time */ }
    setSyncing(false)
  }

  useEffect(() => {
    if (online && pending > 0) { void sync() }
  }, [online, pending])

  if (pending === 0 && online) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-pill font-text text-12"
        style={{
          background: online ? 'rgba(0,200,150,0.12)' : 'rgba(255,77,77,0.12)',
          border: `1px solid ${online ? 'rgba(0,200,150,0.30)' : 'rgba(255,77,77,0.30)'}`,
          color: online ? '#00C896' : '#FF4D4D',
        }}
      >
        {!online && <span>Offline</span>}
        {pending > 0 && (
          <button onClick={sync} disabled={syncing || !online} className="flex items-center gap-1">
            {syncing ? 'Syncing…' : `${pending} pending`}
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
