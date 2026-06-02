import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Glass } from '../../components/ui/Glass'
import { Check, Shield } from '../../components/ui/Icons'
import {
  api,
  type ConnectorSubmission,
  type SubmissionResult,
  type SubmitConfig,
} from '../../lib/api'

type Category = ConnectorSubmission['category']

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'wallet', label: 'Wallet' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'on-ramp', label: 'On-ramp' },
  { value: 'data', label: 'Data' },
]

const inputClass =
  'w-full bg-surface border border-white/12 rounded-glass px-4 py-3 text-15 font-text text-white outline-none placeholder:text-white/25 focus:border-white/25 transition-colors'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-13 text-white/50 font-text mb-2">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-12 text-white/35 font-text">{hint}</p>}
    </div>
  )
}

function StepHeader({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${active || done ? 'opacity-100' : 'opacity-40'}`}>
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-pill text-12 font-numbers shrink-0 ${
          done ? 'bg-positive/20 text-positive' : active ? 'bg-bitcoin text-bg' : 'bg-white/10 text-white/60'
        }`}
      >
        {done ? <Check size={13} /> : n}
      </span>
      <span className="text-13 font-text text-white/80">{label}</span>
    </div>
  )
}

const CHECKS: { key: keyof ConnectorSubmission['declarations']; label: string }[] = [
  { key: 'readOnly', label: 'This connector is read-only. It cannot send transactions.' },
  { key: 'testsPass', label: 'I have run the SATS connector test suite and all tests pass.' },
  { key: 'maintain', label: 'I will maintain this connector or transfer ownership if I can no longer do so.' },
  { key: 'terms', label: 'I accept the SATS Connector Network terms.' },
]

export default function Submit() {
  const [cfg, setCfg] = useState<SubmitConfig | null>(null)

  const [name, setName] = useState('')
  const [githubUsername, setGithubUsername] = useState('')
  const [organization, setOrganization] = useState('')
  const [email, setEmail] = useState('')

  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [emailToken, setEmailToken] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [repoUrl, setRepoUrl] = useState('')
  const [connectorId, setConnectorId] = useState('')
  const [category, setCategory] = useState<Category>('wallet')
  const [working, setWorking] = useState<'yes' | 'in_progress'>('yes')
  const [rationale, setRationale] = useState('')

  const [declarations, setDeclarations] = useState({
    readOnly: false,
    testsPass: false,
    maintain: false,
    terms: false,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmissionResult | null>(null)

  useEffect(() => {
    api.getSubmitConfig().then(setCfg).catch(() => setCfg({ emailEnabled: false, githubEnabled: false }))
  }, [])

  const emailVerified = Boolean(emailToken)
  const step1Done = emailVerified && name.trim() && githubUsername.trim()
  const step2Done =
    repoUrl.trim() && /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(connectorId) && rationale.trim().length >= 10
  const allDeclared = Object.values(declarations).every(Boolean)

  async function sendCode() {
    setError(null)
    setSending(true)
    try {
      await api.sendSubmitCode(email)
      setCodeSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^\d+:\s*/, '') : 'Could not send code')
    } finally {
      setSending(false)
    }
  }

  async function verify() {
    setError(null)
    setVerifying(true)
    try {
      const r = await api.verifySubmitCode(email, code)
      setEmailToken(r.emailToken)
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^\d+:\s*/, '') : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  async function submit() {
    setError(null)
    setSubmitting(true)
    try {
      const r = await api.submitConnector({
        emailToken,
        name: name.trim(),
        githubUsername: githubUsername.trim().replace(/^@/, ''),
        organization: organization.trim() || undefined,
        repoUrl: repoUrl.trim(),
        connectorId: connectorId.trim(),
        category,
        working,
        rationale: rationale.trim(),
        declarations,
      })
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^\d+:\s*/, '') : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        >
          <Glass radius="card" className="p-8 text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-pill bg-positive/15 text-positive mb-4">
              <Check size={24} />
            </span>
            <h1 className="font-brand font-bold text-28 mb-2">Submission received</h1>
            <p className="text-15 text-white/55 font-text mb-6">
              We have created a tracking issue and emailed you a confirmation. The Afribit team
              reviews submissions within 48 hours.
            </p>
            <a
              href={result.issueUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-11 px-6 rounded-pill bg-bitcoin text-bg font-display font-semibold text-15 hover:opacity-90 transition-opacity"
            >
              View issue #{result.issueNumber}
            </a>
          </Glass>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-12 pb-8">
      <div className="mb-8">
        <h1 className="font-brand font-bold text-34 mb-2">Submit a connector</h1>
        <p className="text-15 text-white/55 font-text">
          List your connector in the SATS Connector Network. Submissions are read-only by design
          and reviewed by the Afribit team.
        </p>
      </div>

      {cfg && (!cfg.emailEnabled || !cfg.githubEnabled) && (
        <div className="flex items-start gap-3 mb-8 px-4 py-3 rounded-glass bg-bitcoin/8 border border-bitcoin/20">
          <span className="text-bitcoin mt-0.5 shrink-0">
            <Shield size={18} />
          </span>
          <p className="text-13 text-white/70 font-text leading-relaxed">
            Submission intake is being configured and is not accepting entries right now. Please
            check back shortly.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <StepHeader n={1} label="Identity" active={!step1Done} done={Boolean(step1Done)} />
        <span className="text-white/20">/</span>
        <StepHeader n={2} label="Connector" active={Boolean(step1Done) && !step2Done} done={Boolean(step1Done && step2Done)} />
        <span className="text-white/20">/</span>
        <StepHeader n={3} label="Declaration" active={Boolean(step1Done && step2Done)} done={false} />
      </div>

      <div className="space-y-6">
        <Glass radius="card" className="p-6 space-y-5">
          <h2 className="font-brand font-semibold text-18">1. Identity</h2>
          <Field label="Your name or team name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Jane Doe" />
          </Field>
          <Field label="GitHub username">
            <input
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              className={inputClass}
              placeholder="janedoe"
            />
          </Field>
          <Field label="Organization (optional)">
            <input value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Email address" hint="We send a 6-digit code to verify your email.">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                disabled={emailVerified}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} flex-1 disabled:opacity-60`}
                placeholder="you@example.com"
              />
              {!emailVerified && (
                <button
                  onClick={sendCode}
                  disabled={sending || !email.trim() || !cfg?.emailEnabled}
                  className="shrink-0 h-[46px] px-4 rounded-glass bg-white/10 text-white font-text text-14 disabled:opacity-40 hover:bg-white/15 transition-colors"
                >
                  {sending ? 'Sending...' : codeSent ? 'Resend' : 'Verify email'}
                </button>
              )}
            </div>
          </Field>

          {emailVerified ? (
            <p className="flex items-center gap-2 text-13 text-positive font-text">
              <Check size={14} /> Email verified
            </p>
          ) : (
            codeSent && (
              <Field label="Verification code">
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    className={`${inputClass} flex-1 font-numbers tracking-[0.3em]`}
                    placeholder="000000"
                  />
                  <button
                    onClick={verify}
                    disabled={verifying || code.trim().length < 6}
                    className="shrink-0 h-[46px] px-5 rounded-glass bg-bitcoin text-bg font-display font-semibold text-14 disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    {verifying ? '...' : 'Confirm'}
                  </button>
                </div>
              </Field>
            )
          )}
        </Glass>

        <Glass radius="card" className={`p-6 space-y-5 ${step1Done ? '' : 'opacity-50 pointer-events-none'}`}>
          <h2 className="font-brand font-semibold text-18">2. Connector details</h2>
          <Field label="GitHub repository URL" hint="Must contain connector.json and a TypeScript module.">
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className={inputClass}
              placeholder="https://github.com/you/your-connector"
            />
          </Field>
          <Field label="Connector ID" hint="Lowercase letters, numbers and hyphens. e.g. blink-wallet">
            <input
              value={connectorId}
              onChange={(e) => setConnectorId(e.target.value.toLowerCase())}
              className={`${inputClass} font-numbers`}
              placeholder="your-connector"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Does it currently work?">
              <select
                value={working}
                onChange={(e) => setWorking(e.target.value as 'yes' | 'in_progress')}
                className={inputClass}
              >
                <option value="yes">Yes</option>
                <option value="in_progress">In progress</option>
              </select>
            </Field>
          </div>
          <Field label="Why does this connector belong in SATS?">
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Describe the provider, who uses it, and why read-only aggregation helps."
            />
          </Field>
        </Glass>

        <Glass radius="card" className={`p-6 space-y-4 ${step1Done && step2Done ? '' : 'opacity-50 pointer-events-none'}`}>
          <h2 className="font-brand font-semibold text-18">3. Declaration</h2>
          {CHECKS.map((c) => (
            <label key={c.key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarations[c.key]}
                onChange={(e) => setDeclarations((d) => ({ ...d, [c.key]: e.target.checked }))}
                className="mt-1 w-4 h-4 accent-bitcoin shrink-0"
              />
              <span className="text-14 text-white/75 font-text leading-relaxed">{c.label}</span>
            </label>
          ))}

          {error && <p className="text-14 text-negative font-text">{error}</p>}

          <button
            onClick={submit}
            disabled={!step1Done || !step2Done || !allDeclared || submitting || !cfg?.githubEnabled}
            className="h-12 px-6 w-full inline-flex items-center justify-center rounded-pill bg-bitcoin text-bg font-display font-semibold text-15 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </Glass>
      </div>
    </div>
  )
}
