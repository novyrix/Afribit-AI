import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Bolt, Check, ChevronRight } from './ui/Icons'
import { Glass, PillButton } from './ui/Glass'
import { api } from '../lib/api'
import { connectNwc, isNwcUri, listNwcTransactions, storeNwcUri } from '../lib/nwc'

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 220 }

type Phase = 'input' | 'connecting' | 'success' | 'error'

export function NWCConnect({
  token, onBack, onDone,
}: {
  token: string
  onBack: () => void
  onDone: (walletConnId: string) => void
}) {
  const [phase, setPhase] = useState<Phase>('input')
  const [uri, setUri] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [balanceSats, setBalanceSats] = useState<number | null>(null)
  const [nickname, setNickname] = useState<string>('Lightning Wallet')
  const [txCount, setTxCount] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [scanSupported, setScanSupported] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanLoop = useRef<number | null>(null)

  useEffect(() => {
    setScanSupported('BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia)
    return () => stopScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopScan() {
    if (scanLoop.current) { window.clearInterval(scanLoop.current); scanLoop.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
    setScanning(false)
  }

  async function startScan() {
    setError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Detector = (window as any).BarcodeDetector
      const detector = new Detector({ formats: ['qr_code'] })
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setScanning(true)
      await new Promise((r) => setTimeout(r, 0))
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      scanLoop.current = window.setInterval(async () => {
        if (!videoRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          const raw: string | undefined = codes?.[0]?.rawValue
          if (raw && isNwcUri(raw)) {
            stopScan()
            setUri(raw.trim())
            void run(raw.trim())
          }
        } catch { /* frame not ready */ }
      }, 350)
    } catch {
      setError('Could not open the camera. Paste the connection string instead.')
      stopScan()
    }
  }

  async function run(value?: string) {
    const candidate = (value ?? uri).trim()
    if (!isNwcUri(candidate)) {
      setError('That does not look like a valid connection string.')
      return
    }
    stopScan()
    setError(null)
    setPhase('connecting')
    try {
      const info = await connectNwc(candidate)
      const name = info.alias?.trim() || 'Lightning Wallet'
      setNickname(name)

      const conn = await api.connectNwc(token, info.pubkey, name)
      storeNwcUri(conn.walletConnId, candidate)

      if (info.balanceSats !== null) setBalanceSats(info.balanceSats)

      const txs = await listNwcTransactions(candidate, 100)
      if (txs.length > 0) {
        try {
          const pushed = await api.pushNwcTransactions(token, conn.walletConnId, txs)
          setTxCount(pushed.inserted)
        } catch {
          /* connection still succeeds even if tx push fails */
        }
      }

      setPhase('success')
      setTimeout(() => onDone(conn.walletConnId), 1600)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection failed'
      setError(msg)
      setPhase('error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING}
      className="fixed inset-0 bg-bg flex flex-col"
    >
      <div className="pt-16 px-5">
        <button
          onClick={() => { stopScan(); onBack() }}
          className="font-text text-15 text-white/50 hover:text-white/70 flex items-center gap-1 transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" /> Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <Glass radius="card" className="w-full max-w-md p-6 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING}
            className="w-16 h-16 rounded-glass mb-5 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Bolt size={32} className="text-bitcoin" />
          </motion.div>

          <h2 className="font-display font-semibold text-22 text-white text-center">
            Connect with NWC
          </h2>

          <div className="w-full mt-6">
            {phase === 'input' && (
              <div className="flex flex-col gap-4">
                <p className="font-text text-13 text-white/55 text-center">
                  Paste your Nostr Wallet Connect string, or scan its QR code.
                </p>

                {scanning ? (
                  <div className="flex flex-col gap-3">
                    <div className="w-full aspect-square rounded-card overflow-hidden bg-black/40">
                      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    </div>
                    <button
                      onClick={stopScan}
                      className="font-text text-13 text-white/50 hover:text-white/70 transition-colors"
                    >
                      Cancel scan
                    </button>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={uri}
                      onChange={(e) => setUri(e.target.value)}
                      placeholder="nostr+walletconnect://..."
                      rows={3}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      className="w-full glass rounded-card p-3 font-mono text-12 text-white placeholder-white/30 resize-none outline-none focus:border-white/25"
                    />
                    {error && <p className="font-text text-13 text-negative text-center">{error}</p>}
                    <PillButton onClick={() => run()}>Connect</PillButton>
                    {scanSupported && (
                      <button
                        onClick={startScan}
                        className="font-text text-14 text-white/60 hover:text-white/80 transition-colors"
                      >
                        Scan QR code instead
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {phase === 'connecting' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="font-text text-14 text-white/55 text-center">
                  Connecting to your wallet…
                </p>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-2 h-2 rounded-full bg-white/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            )}

            {phase === 'error' && (
              <div className="flex flex-col gap-4">
                <p className="font-text text-13 text-negative text-center">{error}</p>
                <p className="font-text text-13 text-white/45 text-center">
                  Check the connection string and try again.
                </p>
                <PillButton onClick={() => setPhase('input')}>Try again</PillButton>
              </div>
            )}

            {phase === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING}
                className="flex flex-col items-center gap-3 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 260 }}
                  className="w-14 h-14 rounded-full bg-positive/15 flex items-center justify-center"
                >
                  <Check size={28} className="text-positive" />
                </motion.div>
                <p className="font-display font-semibold text-18 text-white">
                  {nickname} connected
                </p>
                {balanceSats !== null && (
                  <p className="font-mono text-22 text-bitcoin tabular">
                    {balanceSats.toLocaleString()} sats
                  </p>
                )}
                {txCount > 0 && (
                  <p className="font-text text-13 text-white/45">
                    {txCount} transactions imported
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </Glass>
      </div>
    </motion.div>
  )
}
