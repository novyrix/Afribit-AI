import { useState } from 'react'
import type {
  ConnectorStatus,
  ConnectorCategory,
  ConnectorAuthType,
  ConnectorManifest,
} from '../lib/api'

export const STATUS_META: Record<
  ConnectorStatus,
  { label: string; color: string }
> = {
  verified: { label: 'Verified', color: '#00C896' },
  in_review: { label: 'In Review', color: '#F7931A' },
  deprecated: { label: 'Deprecated', color: '#FF4D4D' },
  community: { label: 'Community', color: '#8A8A93' },
}

export const CATEGORY_META: Record<ConnectorCategory, string> = {
  wallet: 'Wallet',
  exchange: 'Exchange',
  on_ramp: 'On-ramp',
  off_ramp: 'Off-ramp',
  data: 'Data',
}

export const AUTH_META: Record<ConnectorAuthType, string> = {
  api_key: 'API Key',
  oauth: 'OAuth',
  invite_code: 'Invite Code',
  nwc_uri: 'NWC URI',
  none: 'No Auth',
}

export const CAPABILITY_LABELS: { key: keyof ConnectorManifest['capabilities']; label: string }[] = [
  { key: 'read_balance', label: 'Balance' },
  { key: 'read_transactions', label: 'History' },
  { key: 'read_profile', label: 'Profile' },
  { key: 'create_invoice', label: 'Create Invoice' },
  { key: 'send_payment', label: 'Send Payment' },
  { key: 'on_ramp', label: 'On-ramp' },
  { key: 'off_ramp', label: 'Off-ramp' },
]

export function StatusBadge({ status }: { status: ConnectorStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-12 font-text"
      style={{ background: `${meta.color}1A`, color: meta.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-pill"
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  )
}

export function ConnectorLogo({
  connector,
  size = 44,
}: {
  connector: ConnectorManifest
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  const initial = connector.name.charAt(0).toUpperCase()
  if (failed || !connector.logo) {
    return (
      <div
        className="flex items-center justify-center rounded-glass font-brand font-semibold shrink-0"
        style={{
          width: size,
          height: size,
          background: `${connector.color}26`,
          color: connector.color,
          fontSize: size * 0.42,
        }}
      >
        {initial}
      </div>
    )
  }
  return (
    <img
      src={`/logos/${connector.logo}`}
      alt={connector.name}
      onError={() => setFailed(true)}
      className="rounded-glass object-contain shrink-0 bg-white/5"
      style={{ width: size, height: size }}
    />
  )
}
