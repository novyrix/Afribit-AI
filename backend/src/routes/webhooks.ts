import { Router, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { query, withTransaction } from '../db/client';
import { config } from '../config';

const router = Router();

const SVIX_TOLERANCE_S = 300;

// ─── Svix signature verification ─────────────────────────────────────────────

function verifySvixSignature(
  rawBody: string,
  msgId: string,
  timestamp: string,
  sigHeader: string,
  secret: string
): boolean {
  const tsNum = parseInt(timestamp, 10);
  if (isNaN(tsNum)) return false;

  const ageS = Math.abs(Date.now() / 1000 - tsNum);
  if (ageS > SVIX_TOLERANCE_S) {
    console.warn(`[webhooks/blink] Timestamp too old: ${ageS}s`);
    return false;
  }

  const toSign = `${msgId}.${timestamp}.${rawBody}`;
  const hmac = createHmac('sha256', Buffer.from(secret.replace(/^whsec_/, ''), 'base64'));
  hmac.update(toSign);
  const expected = `v1,${hmac.digest('base64')}`;

  const signatures = sigHeader.split(' ');
  for (const sig of signatures) {
    try {
      const expectedBuf = Buffer.from(expected);
      const sigBuf = Buffer.from(sig);
      if (expectedBuf.length === sigBuf.length && timingSafeEqual(expectedBuf, sigBuf)) {
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

// ─── Blink webhook payload types ─────────────────────────────────────────────

interface BlinkWebhookPayload {
  eventType?: string;
  type?: string;
  data?: {
    walletId?: string;
    txid?: string;
    externalId?: string;
    direction?: string;
    settlementAmount?: number;
    settlementFee?: number;
    memo?: string | null;
    createdAt?: number;
  };
}

// ─── POST /webhooks/blink ─────────────────────────────────────────────────────

router.post('/blink', async (req: Request, res: Response) => {
  if (!config.blink.webhookSecret) {
    console.error('[webhooks/blink] BLINK_WEBHOOK_SECRET not configured');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  const msgId    = req.headers['svix-id'] as string | undefined;
  const timestamp = req.headers['svix-timestamp'] as string | undefined;
  const sigHeader = req.headers['svix-signature'] as string | undefined;

  if (!msgId || !timestamp || !sigHeader) {
    res.status(401).json({ error: 'Missing Svix headers' });
    return;
  }

  const rawBody = JSON.stringify(req.body);

  if (!verifySvixSignature(rawBody, msgId, timestamp, sigHeader, config.blink.webhookSecret)) {
    console.warn('[webhooks/blink] Signature verification failed for msg:', msgId);
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const payload = req.body as BlinkWebhookPayload;
  const eventType = payload.eventType ?? payload.type ?? 'unknown';

  try {
    await withTransaction(async (client) => {
      // Idempotency: store raw event, skip if already processed
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO webhook_events (source, event_id, event_type, payload)
         VALUES ('blink', $1, $2, $3)
         ON CONFLICT (source, event_id) DO NOTHING
         RETURNING id`,
        [msgId, eventType, JSON.stringify(payload)]
      );

      if (!inserted.rows.length) {
        console.log(`[webhooks/blink] Duplicate event skipped: ${msgId}`);
        return;
      }

      // Handle transaction events — cache them for all matching Blink wallets
      const isTransactionEvent = eventType.toLowerCase().includes('transaction');
      if (isTransactionEvent && payload.data) {
        const d = payload.data;
        const externalId = d.externalId ?? d.txid ?? msgId;
        const direction: 'in' | 'out' = d.direction?.toUpperCase() === 'RECEIVE' ? 'in' : 'out';
        const amountSats = Math.abs(d.settlementAmount ?? 0);
        const feeSats = Math.abs(d.settlementFee ?? 0);
        const occurredAt = d.createdAt ? new Date(d.createdAt * 1000) : new Date();

        if (amountSats > 0 && d.walletId) {
          // Find all active wallet connections for this Blink wallet ID
          const wallets = await client.query<{ id: string; session_id: string }>(
            `SELECT id, session_id FROM wallet_connections
             WHERE wallet_type = 'blink' AND external_id = $1 AND is_active = TRUE`,
            [d.walletId]
          );

          for (const wallet of wallets.rows) {
            await client.query(
              `INSERT INTO transactions_cache
                 (wallet_conn_id, session_id, external_id, direction, amount_sats, fee_sats, memo, occurred_at, raw)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (wallet_conn_id, external_id) DO NOTHING`,
              [
                wallet.id, wallet.session_id, externalId,
                direction, amountSats, feeSats,
                d.memo ?? null, occurredAt, JSON.stringify(payload),
              ]
            );
          }

          console.log(`[webhooks/blink] Cached txn ${externalId} (${direction} ${amountSats} sats) for ${wallets.rows.length} wallet(s)`);
        }
      }

      // Mark event as processed
      await client.query(
        `UPDATE webhook_events SET processed = TRUE WHERE source = 'blink' AND event_id = $1`,
        [msgId]
      );
    });

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhooks/blink] Processing error:', (err as Error).message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
