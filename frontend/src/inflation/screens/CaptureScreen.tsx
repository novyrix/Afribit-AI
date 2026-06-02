import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { inflationApi, INFLATION_COMMUNITY_KEY, type InflationItem, type InflationCommunity, type InflationMerchant, type InflationUser } from '../lib/api'
import { queuePurchase, getPendingCount } from '../lib/offline'
import { SyncIndicator } from '../components/SyncIndicator'
import { PillButton } from '../../components/ui/Glass'
import { Check } from '../../components/ui/Icons'

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 220 }
type PayMethod = 'cash' | 'mpesa' | 'bitcoin' | 'other'

const PAY_BUTTONS: { value: PayMethod; label: string }[] = [
  { value: 'cash',    label: 'Cash' },
  { value: 'mpesa',   label: 'M-Pesa' },
  { value: 'bitcoin', label: 'Bitcoin' },
  { value: 'other',   label: 'Other' },
]

function todayLocal() {
  return new Date().toISOString().slice(0, 10)
}

export function CaptureScreen({ token, user }: { token: string; user: InflationUser }) {
  const [items, setItems] = useState<InflationItem[]>([])
  const [communities, setCommunities] = useState<InflationCommunity[]>([])
  const [merchants, setMerchants] = useState<InflationMerchant[]>([])

  const [itemSearch, setItemSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<InflationItem | null>(null)
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [priceKes, setPriceKes] = useState('')
  const [payment, setPayment] = useState<PayMethod>('cash')
  const [satsPaid, setSatsPaid] = useState('')
  const [communityId, setCommunityId] = useState<string>(
    () => localStorage.getItem(INFLATION_COMMUNITY_KEY) ?? (user.community_id ?? '')
  )
  const [captureDate, setCaptureDate] = useState(todayLocal)
  const [merchantId, setMerchantId] = useState('')
  const [notes, setNotes] = useState('')
  const [showOptional, setShowOptional] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  const itemInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inflationApi.getItems().then(setItems).catch(() => [])
    inflationApi.getCommunities().then(setCommunities).catch(() => [])
    getPendingCount().then(setPendingCount).catch(() => 0)
  }, [])

  useEffect(() => {
    if (communityId) {
      localStorage.setItem(INFLATION_COMMUNITY_KEY, communityId)
      inflationApi.getMerchants(token, communityId).then(setMerchants).catch(() => [])
    }
  }, [communityId, token])

  const filteredItems = items.filter((i) => {
    const q = itemSearch.toLowerCase()
    return i.name_english.toLowerCase().includes(q) || (i.name_swahili ?? '').toLowerCase().includes(q)
  }).slice(0, 8)

  function selectItem(item: InflationItem) {
    setSelectedItem(item)
    setItemSearch(item.name_english)
    setQuantity(String(item.standard_quantity))
    setUnit(item.standard_unit)
    setShowItemDropdown(false)
  }

  function reset() {
    setSelectedItem(null)
    setItemSearch('')
    setQuantity('')
    setUnit('')
    setPriceKes('')
    setPayment('cash')
    setSatsPaid('')
    setNotes('')
    setMerchantId('')
    setSuccess(false)
    setError(null)
    setTimeout(() => itemInputRef.current?.focus(), 100)
  }

  async function submit() {
    if (!itemSearch.trim() || !quantity || !priceKes || !communityId) {
      setError('Fill in all required fields.')
      return
    }
    setError(null)
    setSubmitting(true)

    const purchase = {
      item_id: selectedItem?.id,
      item_name: selectedItem?.name_english ?? itemSearch.trim(),
      category: selectedItem?.category ?? 'other',
      quantity: parseFloat(quantity),
      unit: unit || 'piece',
      price_kes: parseFloat(priceKes),
      payment_method: payment,
      sats_paid: payment === 'bitcoin' && satsPaid ? parseInt(satsPaid) : undefined,
      merchant_id: merchantId || undefined,
      community_id: communityId,
      capture_date: captureDate,
      notes: notes.trim() || undefined,
    }

    try {
      await inflationApi.submitPurchase(token, purchase)
    } catch {
      const offline_id = await queuePurchase({ ...purchase, capture_date: captureDate })
      setPendingCount((n) => n + 1)
      void offline_id
    }

    setSubmitting(false)
    setSuccess(true)
    setTimeout(reset, 1800)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING}
      className="fixed inset-0 flex flex-col"
    >
      <div className="pt-safe-or-12 px-5 pb-3 flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top), 3rem)' }}>
        <div>
          <div className="font-ui text-11 text-white/35 uppercase tracking-wider">Sats Cost of Living</div>
          <div className="font-brand font-semibold text-18 text-white mt-0.5">Log a purchase</div>
        </div>
        <SyncIndicator token={token} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-positive/15 flex items-center justify-center">
                <Check size={32} className="text-positive" />
              </div>
              <p className="font-display font-semibold text-18 text-white">Saved</p>
              {pendingCount > 0 && (
                <p className="font-text text-13 text-white/45">{pendingCount} entries queued offline</p>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={SPRING} className="flex flex-col gap-4 pt-2">

              <div className="relative">
                <label className="font-text text-12 text-white/45 mb-1 block">Item *</label>
                <input
                  ref={itemInputRef}
                  type="text"
                  value={itemSearch}
                  onChange={(e) => { setItemSearch(e.target.value); setShowItemDropdown(true); setSelectedItem(null) }}
                  onFocus={() => setShowItemDropdown(true)}
                  placeholder="Search or type item name…"
                  autoComplete="off"
                  className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                             font-text text-14 text-white placeholder:text-white/25
                             focus:outline-none focus:border-bitcoin/60 transition-colors"
                />
                {showItemDropdown && filteredItems.length > 0 && itemSearch.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full z-20 mt-1 rounded-card overflow-hidden"
                    style={{ background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onMouseDown={() => selectItem(item)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.05] transition-colors text-left"
                      >
                        <span className="font-text text-14 text-white">{item.name_english}</span>
                        {item.name_swahili && (
                          <span className="font-text text-12 text-white/40">{item.name_swahili}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-text text-12 text-white/45 mb-1 block">Quantity *</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 2"
                    inputMode="decimal"
                    className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                               font-mono text-14 text-white placeholder:text-white/25
                               focus:outline-none focus:border-bitcoin/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="font-text text-12 text-white/45 mb-1 block">Unit *</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg / litre / piece"
                    className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                               font-text text-14 text-white placeholder:text-white/25
                               focus:outline-none focus:border-bitcoin/60 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="font-text text-12 text-white/45 mb-1 block">Price (KSh) *</label>
                <input
                  type="number"
                  value={priceKes}
                  onChange={(e) => setPriceKes(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  className="w-full h-16 px-5 rounded-glass bg-white/[0.06] border border-white/15
                             font-mono text-26 text-white placeholder:text-white/20
                             focus:outline-none focus:border-bitcoin/60 transition-colors"
                />
              </div>

              <div>
                <label className="font-text text-12 text-white/45 mb-2 block">Payment method *</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAY_BUTTONS.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => setPayment(b.value)}
                      className="h-11 rounded-glass font-text text-13 font-medium transition-all"
                      style={{
                        background: payment === b.value ? 'rgba(247,147,26,0.18)' : 'rgba(255,255,255,0.05)',
                        border: payment === b.value ? '1px solid rgba(247,147,26,0.55)' : '1px solid rgba(255,255,255,0.10)',
                        color: payment === b.value ? '#F7931A' : 'rgba(255,255,255,0.60)',
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {payment === 'bitcoin' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={SPRING}
                  >
                    <label className="font-text text-12 text-white/45 mb-1 block">Sats paid</label>
                    <input
                      type="number"
                      value={satsPaid}
                      onChange={(e) => setSatsPaid(e.target.value)}
                      placeholder="e.g. 4100"
                      inputMode="numeric"
                      className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                                 font-mono text-14 text-bitcoin placeholder:text-white/25
                                 focus:outline-none focus:border-bitcoin/60 transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {communities.length > 0 && (
                <div>
                  <label className="font-text text-12 text-white/45 mb-1 block">Community *</label>
                  <select
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                               font-text text-14 text-white focus:outline-none focus:border-bitcoin/60 transition-colors"
                    style={{ appearance: 'none' }}
                  >
                    <option value="" disabled>Select community</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-text text-12 text-white/45 mb-1 block">Date *</label>
                <input
                  type="date"
                  value={captureDate}
                  onChange={(e) => setCaptureDate(e.target.value)}
                  max={todayLocal()}
                  className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                             font-text text-14 text-white focus:outline-none focus:border-bitcoin/60 transition-colors"
                />
              </div>

              <button
                onClick={() => setShowOptional(!showOptional)}
                className="font-text text-13 text-white/40 hover:text-white/60 transition-colors text-left flex items-center gap-1"
              >
                <span style={{ display: 'inline-block', transform: showOptional ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
                {showOptional ? 'Hide optional fields' : 'Add merchant / notes'}
              </button>

              <AnimatePresence>
                {showOptional && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={SPRING}
                    className="flex flex-col gap-3"
                  >
                    {merchants.length > 0 && (
                      <div>
                        <label className="font-text text-12 text-white/45 mb-1 block">Merchant</label>
                        <select
                          value={merchantId}
                          onChange={(e) => setMerchantId(e.target.value)}
                          className="w-full h-12 px-4 rounded-glass bg-white/[0.06] border border-white/15
                                     font-text text-14 text-white focus:outline-none focus:border-bitcoin/60 transition-colors"
                          style={{ appearance: 'none' }}
                        >
                          <option value="">Select merchant (optional)</option>
                          {merchants.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}{m.accepts_bitcoin ? ' (BTC)' : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="font-text text-12 text-white/45 mb-1 block">Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional notes about this purchase"
                        rows={2}
                        maxLength={200}
                        className="w-full px-4 py-3 rounded-glass bg-white/[0.06] border border-white/15
                                   font-text text-14 text-white placeholder:text-white/25 resize-none
                                   focus:outline-none focus:border-bitcoin/60 transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="font-text text-13 text-negative">{error}</p>}

              <div className="pt-2">
                <PillButton
                  onClick={submit}
                  disabled={submitting || !itemSearch.trim() || !priceKes || !communityId}
                >
                  {submitting ? 'Saving…' : 'Log purchase'}
                </PillButton>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
