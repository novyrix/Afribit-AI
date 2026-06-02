const DB_NAME = 'sats_secure'
const STORE = 'keys'
const KEY_ID = 'master'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

let cachedKey: CryptoKey | null = null

async function getMasterKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  const db = await openDb()
  const existing = (await idbGet(db, KEY_ID)) as CryptoKey | undefined
  if (existing) {
    cachedKey = existing
    return existing
  }
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  await idbPut(db, KEY_ID, key)
  cachedKey = key
  return key
}

function toB64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function fromB64(b64: string): Uint8Array {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

export async function secureSet(name: string, plaintext: string): Promise<void> {
  const key = await getMasterKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder().encode(plaintext)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc)
  const payload = toB64(iv) + ':' + toB64(new Uint8Array(ct))
  try { localStorage.setItem(name, payload) } catch { /* noop */ }
}

export async function secureGet(name: string): Promise<string | null> {
  let payload: string | null = null
  try { payload = localStorage.getItem(name) } catch { return null }
  if (!payload || !payload.includes(':')) return null
  try {
    const key = await getMasterKey()
    const [ivB64, ctB64] = payload.split(':')
    const iv = fromB64(ivB64)
    const ct = fromB64(ctB64)
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    return new TextDecoder().decode(dec)
  } catch {
    return null
  }
}

export function secureRemove(name: string): void {
  try { localStorage.removeItem(name) } catch { /* noop */ }
}
