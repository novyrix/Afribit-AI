export type ResponseLanguage = 'en' | 'sw' | 'shg' | 'auto'
export type FinancialPersonality = 'facts' | 'teach' | 'coach' | 'all'
export type PrivacyLevel = 'full' | 'summaries' | 'ask'
export type NotificationTone = 'never' | 'unusual' | 'weekly'

export type AIPreferences = {
  responseLanguage: ResponseLanguage
  financialPersonality: FinancialPersonality
  privacyLevel: PrivacyLevel
  notificationTone: NotificationTone
}

const PREFS_KEY = 'sats_ai_preferences'

export const DEFAULT_PREFERENCES: AIPreferences = {
  responseLanguage: 'auto',
  financialPersonality: 'all',
  privacyLevel: 'full',
  notificationTone: 'unusual',
}

export function getPreferences(): AIPreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(prefs: AIPreferences) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function hasPreferences(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(PREFS_KEY) !== null
}
