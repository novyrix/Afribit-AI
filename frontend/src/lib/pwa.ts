export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    window.dispatchEvent(new Event('sats-install-ready'))
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
  })
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferred
}

export function clearDeferredInstallPrompt() {
  deferred = null
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
}

export type Platform = {
  isIOS: boolean
  isAndroid: boolean
  isStandalone: boolean
  supportsBeforeInstallPrompt: boolean
  isChromiumAndroid: boolean
  isSamsungInternet: boolean
  isSafariIOS: boolean
  isChromeIOS: boolean
  isDesktop: boolean
}

export function getPlatform(): Platform {
  if (typeof navigator === 'undefined') {
    return {
      isIOS: false, isAndroid: false, isStandalone: false,
      supportsBeforeInstallPrompt: false, isChromiumAndroid: false,
      isSamsungInternet: false, isSafariIOS: false, isChromeIOS: false,
      isDesktop: true,
    }
  }
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  const isAndroid = /Android/.test(ua)
  const isChromeIOS = isIOS && /CriOS/.test(ua)
  const isSafariIOS = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  const isSamsungInternet = isAndroid && /SamsungBrowser/.test(ua)
  const isChromiumAndroid = isAndroid && /Chrome/.test(ua) && !isSamsungInternet
  const supportsBeforeInstallPrompt = 'BeforeInstallPromptEvent' in window || isAndroid
  return {
    isIOS,
    isAndroid,
    isStandalone: isStandalone(),
    supportsBeforeInstallPrompt,
    isChromiumAndroid,
    isSamsungInternet,
    isSafariIOS,
    isChromeIOS,
    isDesktop: !isIOS && !isAndroid,
  }
}
