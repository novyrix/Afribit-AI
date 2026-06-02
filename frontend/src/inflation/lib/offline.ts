const DB_NAME = 'afribit-inflation'
const DB_VERSION = 1
const STORE = 'pending_purchases'

export type PendingPurchase = {
  offline_id: string
  item_id?: string
  item_name: string
  category: string
  quantity: number
  unit: string
  price_kes: number
  payment_method: 'cash' | 'mpesa' | 'bitcoin' | 'other'
  sats_paid?: number
  merchant_id?: string
  community_id: string
  capture_date: string
  notes?: string
  queued_at: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'offline_id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function queuePurchase(purchase: Omit<PendingPurchase, 'queued_at' | 'offline_id'>): Promise<string> {
  const db = await openDb()
  const offline_id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const record: PendingPurchase = { ...purchase, offline_id, queued_at: Date.now() }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(record)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
  db.close()
  return offline_id
}

export async function getPendingCount(): Promise<number> {
  const db = await openDb()
  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return count
}

export async function getPendingPurchases(): Promise<PendingPurchase[]> {
  const db = await openDb()
  const items = await new Promise<PendingPurchase[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return items
}

export async function removePurchase(offline_id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).delete(offline_id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
  db.close()
}

export async function clearSyncedPurchases(offlineIds: string[]): Promise<void> {
  for (const id of offlineIds) {
    await removePurchase(id).catch(() => { /* ignore */ })
  }
}
