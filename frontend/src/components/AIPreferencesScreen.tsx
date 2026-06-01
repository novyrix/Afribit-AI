import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronRight } from './ui/Icons'
import {
  getPreferences, savePreferences,
  type AIPreferences,
} from '../lib/preferences'

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 220 }

type Option<T extends string> = { value: T; label: string; hint: string }

const RESPONSE_LANGUAGE: Option<AIPreferences['responseLanguage']>[] = [
  { value: 'auto', label: 'Match my question', hint: 'Reply in the language I ask in' },
  { value: 'en', label: 'English', hint: 'Always reply in English' },
  { value: 'sw', label: 'Kiswahili', hint: 'Always reply in Kiswahili' },
  { value: 'shg', label: 'Sheng', hint: 'Always reply in Sheng' },
]

const PERSONALITY: Option<AIPreferences['financialPersonality']>[] = [
  { value: 'all', label: 'Balanced', hint: 'A bit of everything' },
  { value: 'facts', label: 'Just the facts', hint: 'Short, direct numbers' },
  { value: 'teach', label: 'Teach me', hint: 'Explain the why behind things' },
  { value: 'coach', label: 'Coach me', hint: 'Encourage better habits' },
]

const PRIVACY: Option<AIPreferences['privacyLevel']>[] = [
  { value: 'full', label: 'Full access', hint: 'See all balances and history' },
  { value: 'summaries', label: 'Summaries only', hint: 'Totals, not every transaction' },
  { value: 'ask', label: 'Ask each time', hint: 'Confirm before reading details' },
]

const NOTIFICATIONS: Option<AIPreferences['notificationTone']>[] = [
  { value: 'unusual', label: 'Unusual activity', hint: 'Only when something stands out' },
  { value: 'weekly', label: 'Weekly summary', hint: 'A recap once a week' },
  { value: 'never', label: 'Never', hint: 'No proactive messages' },
]

export function AIPreferencesScreen({ onContinue }: { onContinue: () => void }) {
  const [prefs, setPrefs] = useState<AIPreferences>(getPreferences())

  function set<K extends keyof AIPreferences>(key: K, value: AIPreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }))
  }

  function done() {
    savePreferences(prefs)
    onContinue()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={SPRING}
      className="absolute inset-0 flex flex-col px-5"
    >
      <div className="pt-[10vh] flex-shrink-0">
        <div className="font-ui text-12 text-white/35 tracking-wider uppercase">
          Make it yours
        </div>
        <h1 className="font-brand font-semibold text-28 text-white mt-3">
          Configure your AI
        </h1>
        <p className="font-ui text-15 text-white/55 mt-2 leading-relaxed">
          You can change all of this later in Settings.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto mt-5 flex flex-col gap-6 pb-4"
           style={{ minHeight: 0 }}>
        <Group
          title="Response language"
          options={RESPONSE_LANGUAGE}
          value={prefs.responseLanguage}
          onChange={(v) => set('responseLanguage', v)}
        />
        <Group
          title="Personality"
          options={PERSONALITY}
          value={prefs.financialPersonality}
          onChange={(v) => set('financialPersonality', v)}
        />
        <Group
          title="Privacy"
          options={PRIVACY}
          value={prefs.privacyLevel}
          onChange={(v) => set('privacyLevel', v)}
        />
        <Group
          title="Notifications"
          options={NOTIFICATIONS}
          value={prefs.notificationTone}
          onChange={(v) => set('notificationTone', v)}
        />
      </div>

      <div className="flex-shrink-0 pt-2">
        <button
          onClick={done}
          className="glass-pill h-14 w-full font-ui font-semibold text-16 text-white
                     mb-6 flex items-center justify-center gap-2"
          style={{
            background: 'rgba(247,147,26,0.18)',
            borderColor: 'rgba(247,147,26,0.55)',
          }}
        >
          Continue
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  )
}

function Group<T extends string>({
  title, options, value, onChange,
}: {
  title: string
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div>
      <h2 className="font-ui text-12 text-white/40 tracking-wider uppercase mb-2.5">
        {title}
      </h2>
      <div className="flex flex-col gap-2">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className="flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-colors"
              style={{
                background: active ? 'rgba(247,147,26,0.10)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(247,147,26,0.55)' : '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div className="min-w-0">
                <div className={`font-brand text-15 ${active ? 'text-white' : 'text-white/80'}`}>
                  {o.label}
                </div>
                <div className="font-ui text-12 text-white/45 mt-0.5">{o.hint}</div>
              </div>
              <span
                className="w-5 h-5 rounded-full flex-shrink-0 ml-3"
                style={{
                  border: active ? '6px solid #F7931A' : '2px solid rgba(255,255,255,0.25)',
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
