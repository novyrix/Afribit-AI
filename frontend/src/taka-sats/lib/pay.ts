import { weblnSendPayment } from '../../lib/webln'

type LnurlPayParams = {
  callback: string
  minSendable: number
  maxSendable: number
  tag: string
}

function lnAddressToUrl(address: string): string {
  const trimmed = address.trim()
  if (/^lnurl/i.test(trimmed)) {
    throw new Error('Bech32 LNURL is not supported. Use a lightning address.')
  }
  const at = trimmed.indexOf('@')
  if (at <= 0 || at === trimmed.length - 1) {
    throw new Error('Invalid lightning address.')
  }
  const name = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  return `https://${domain}/.well-known/lnurlp/${name}`
}

async function resolveInvoice(address: string, amountSats: number, comment: string): Promise<string> {
  const metaUrl = lnAddressToUrl(address)
  const metaRes = await fetch(metaUrl)
  if (!metaRes.ok) throw new Error('Could not reach recipient wallet.')
  const meta = (await metaRes.json()) as LnurlPayParams & { reason?: string }
  if (meta.tag !== 'payRequest' || !meta.callback) {
    throw new Error('Recipient wallet does not support payments.')
  }
  const amountMsat = amountSats * 1000
  if (amountMsat < meta.minSendable || amountMsat > meta.maxSendable) {
    throw new Error('Amount outside recipient limits.')
  }
  const url = new URL(meta.callback)
  url.searchParams.set('amount', String(amountMsat))
  if (comment) url.searchParams.set('comment', comment.slice(0, 140))
  const cbRes = await fetch(url.toString())
  if (!cbRes.ok) throw new Error('Could not request invoice from recipient.')
  const cb = (await cbRes.json()) as { pr?: string; reason?: string; status?: string }
  if (!cb.pr) throw new Error(cb.reason ?? 'Recipient did not return an invoice.')
  return cb.pr
}

export async function payLightningAddress(
  address: string,
  amountSats: number,
  comment: string,
): Promise<{ preimage: string }> {
  const invoice = await resolveInvoice(address, amountSats, comment)
  return weblnSendPayment(invoice)
}
