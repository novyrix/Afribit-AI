import { config } from '../config';

export type PayResult =
  | { ok: true; txId: string }
  | { ok: false; error: string; code: 'unconfigured' | 'resolve_failed' | 'invoice_failed' | 'pay_failed' };

export function isLnbitsConfigured(): boolean {
  return Boolean(config.lnbits.url && config.lnbits.adminKey);
}

function lnbitsHeaders() {
  return { 'Content-Type': 'application/json', 'X-Api-Key': config.lnbits.adminKey };
}

/** Resolve a Lightning address (user@domain) into a bolt11 invoice for the given sats. */
async function resolveLightningAddress(address: string, amountSats: number, memo: string): Promise<string> {
  const [name, domain] = address.split('@');
  if (!name || !domain) throw new Error('resolve_failed');

  const metaUrl = `https://${domain}/.well-known/lnurlp/${name}`;
  const metaRes = await fetch(metaUrl);
  if (!metaRes.ok) throw new Error('resolve_failed');
  const meta = (await metaRes.json()) as { callback?: string; minSendable?: number; maxSendable?: number };
  if (!meta.callback) throw new Error('resolve_failed');

  const msat = amountSats * 1000;
  if (meta.minSendable && msat < meta.minSendable) throw new Error('resolve_failed');
  if (meta.maxSendable && msat > meta.maxSendable) throw new Error('resolve_failed');

  const sep = meta.callback.includes('?') ? '&' : '?';
  const cbUrl = `${meta.callback}${sep}amount=${msat}&comment=${encodeURIComponent(memo).slice(0, 200)}`;
  const cbRes = await fetch(cbUrl);
  if (!cbRes.ok) throw new Error('invoice_failed');
  const cb = (await cbRes.json()) as { pr?: string };
  if (!cb.pr) throw new Error('invoice_failed');
  return cb.pr;
}

/** Pay a bolt11 invoice from the Taka Sats LNbits wallet. Returns the payment hash. */
async function payInvoice(bolt11: string): Promise<string> {
  const res = await fetch(`${config.lnbits.url}/api/v1/payments`, {
    method: 'POST',
    headers: lnbitsHeaders(),
    body: JSON.stringify({ out: true, bolt11 }),
  });
  if (!res.ok) throw new Error('pay_failed');
  const body = (await res.json()) as { payment_hash?: string };
  if (!body.payment_hash) throw new Error('pay_failed');
  return body.payment_hash;
}

/**
 * Pay a collector or supervisor at their Lightning / Machankura address.
 * Fedi/Blink/Machankura all expose a Lightning address we resolve via LNURL-pay.
 */
export async function payLightningAddress(
  address: string,
  amountSats: number,
  memo: string,
): Promise<PayResult> {
  if (!isLnbitsConfigured()) return { ok: false, error: 'LNbits not configured', code: 'unconfigured' };
  try {
    const bolt11 = await resolveLightningAddress(address, amountSats, memo);
    const txId = await payInvoice(bolt11);
    return { ok: true, txId };
  } catch (err) {
    const code = (err as Error).message;
    if (code === 'resolve_failed') return { ok: false, error: 'Could not resolve wallet address', code: 'resolve_failed' };
    if (code === 'invoice_failed') return { ok: false, error: 'Could not generate invoice', code: 'invoice_failed' };
    return { ok: false, error: 'Payment failed', code: 'pay_failed' };
  }
}

/** Current balance of the backing LNbits wallet, in sats. Null if unavailable. */
export async function getLnbitsBalanceSats(): Promise<number | null> {
  if (!isLnbitsConfigured()) return null;
  try {
    const res = await fetch(`${config.lnbits.url}/api/v1/wallet`, { headers: lnbitsHeaders() });
    if (!res.ok) return null;
    const body = (await res.json()) as { balance?: number };
    if (typeof body.balance !== 'number') return null;
    return Math.floor(body.balance / 1000);
  } catch {
    return null;
  }
}
