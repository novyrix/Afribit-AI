import { useState } from 'react'
import { PageShell, SectionLabel } from './PageShell'
import { ChevronRight } from '../ui/Icons'
import {
  getPreferences, savePreferences, type AIPreferences,
} from '../../lib/preferences'

const LANG_KEY = 'sats_lang'

const LANG_LABEL: Record<string, string> = { en: 'English', sw: 'Kiswahili', shg: 'Sheng' }
const RESP_LABEL: Record<AIPreferences['responseLanguage'], string> = {
  auto: 'Match question', en: 'English', sw: 'Kiswahili', shg: 'Sheng',
}
const PERS_LABEL: Record<AIPreferences['financialPersonality'], string> = {
  all: 'Balanced', facts: 'Just facts', teach: 'Teach me', coach: 'Coach me',
}
const PRIV_LABEL: Record<AIPreferences['privacyLevel'], string> = {
  full: 'Full access', summaries: 'Summaries', ask: 'Ask each time',
}
const NOTI_LABEL: Record<AIPreferences['notificationTone'], string> = {
  never: 'Never', unusual: 'Unusual activity', weekly: 'Weekly summary',
}

function cycle<T>(arr: T[], cur: T): T {
  const i = arr.indexOf(cur)
  return arr[(i + 1) % arr.length]
}

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<AIPreferences>(getPreferences())
  const [lang, setLang] = useState<string>(localStorage.getItem(LANG_KEY) || 'en')
  const [haptics, setHaptics] = useState(localStorage.getItem('sats_haptics') !== 'off')

  function update(p: AIPreferences) {
    setPrefs(p); savePreferences(p)
  }
  function setLanguage(v: string) {
    setLang(v); localStorage.setItem(LANG_KEY, v)
  }
  function toggleHaptics() {
    const v = !haptics; setHaptics(v)
    localStorage.setItem('sats_haptics', v ? 'on' : 'off')
  }

  return (
    <PageShell title="Settings" onBack={onBack}>
      <SectionLabel>Display & language</SectionLabel>
      <Card>
        <Row
          label="App language"
          value={LANG_LABEL[lang] ?? lang}
          onClick={() => setLanguage(cycle(['en', 'sw', 'shg'], lang))}
        />
        <Toggle label="Haptic feedback" on={haptics} onClick={toggleHaptics} />
      </Card>

      <SectionLabel>AI behaviour</SectionLabel>
      <Card>
        <Row
          label="Response language"
          value={RESP_LABEL[prefs.responseLanguage]}
          onClick={() => update({ ...prefs, responseLanguage: cycle(['auto', 'en', 'sw', 'shg'], prefs.responseLanguage) })}
        />
        <Row
          label="Personality"
          value={PERS_LABEL[prefs.financialPersonality]}
          onClick={() => update({ ...prefs, financialPersonality: cycle(['all', 'facts', 'teach', 'coach'], prefs.financialPersonality) })}
        />
        <Row
          label="Privacy level"
          value={PRIV_LABEL[prefs.privacyLevel]}
          onClick={() => update({ ...prefs, privacyLevel: cycle(['full', 'summaries', 'ask'], prefs.privacyLevel) })}
        />
      </Card>

      <SectionLabel>Notifications</SectionLabel>
      <Card>
        <Row
          label="Proactive messages"
          value={NOTI_LABEL[prefs.notificationTone]}
          onClick={() => update({ ...prefs, notificationTone: cycle(['unusual', 'weekly', 'never'], prefs.notificationTone) })}
        />
      </Card>

      <SectionLabel>About</SectionLabel>
      <Card>
        <Row label="Version" value="V4" />
        <Row label="Made by" value="Afribit Africa" />
      </Card>

      <p className="font-ui text-12 text-white/30 text-center mt-6">
        Afribit Africa · afribit.africa
      </p>
    </PageShell>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
      {children}
    </div>
  )
}

function Row({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left
                 border-b border-white/[0.06] last:border-b-0 disabled:cursor-default"
    >
      <span className="font-ui text-14 text-white/80">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="font-ui text-13 text-white/45">{value}</span>
        {onClick && <ChevronRight size={15} className="text-white/30" />}
      </span>
    </button>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <div className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] last:border-b-0">
      <span className="font-ui text-14 text-white/80">{label}</span>
      <button
        onClick={onClick}
        className="w-11 h-6 rounded-full p-0.5 transition-colors flex"
        style={{ background: on ? '#F7931A' : 'rgba(255,255,255,0.15)' }}
        aria-label={label}
      >
        <span
          className="w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}
