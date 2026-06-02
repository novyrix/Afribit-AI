import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const EMAIL_TOKEN_TTL = '30m';

export interface SubmissionPayload {
  emailToken: string;
  name: string;
  githubUsername: string;
  organization?: string;
  repoUrl: string;
  connectorId: string;
  category: string;
  working: 'yes' | 'in_progress';
  rationale: string;
  declarations: {
    readOnly: boolean;
    testsPass: boolean;
    maintain: boolean;
    terms: boolean;
  };
}

interface PendingCode {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const pending = new Map<string, PendingCode>();

export class SubmissionError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'SubmissionError';
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
}

export function isGithubConfigured(): boolean {
  return Boolean(config.github.token && config.github.repo);
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendVerificationCode(rawEmail: string): Promise<void> {
  if (!isEmailConfigured()) {
    throw new SubmissionError(503, 'Email verification is not configured.');
  }
  const email = normalizeEmail(rawEmail);
  const existing = pending.get(email);
  const now = Date.now();
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    throw new SubmissionError(429, `Please wait ${wait}s before requesting another code.`);
  }

  const code = generateCode();
  pending.set(email, { code, expiresAt: now + CODE_TTL_MS, attempts: 0, lastSentAt: now });

  await getTransporter().sendMail({
    from: config.smtp.from,
    to: rawEmail.trim(),
    subject: 'Your SATS Connector submission code',
    text:
      `Your Afribit SATS verification code is ${code}\n\n` +
      `It expires in 10 minutes. If you did not request this, ignore this email.`,
    html:
      `<p>Your Afribit SATS verification code is:</p>` +
      `<p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>` +
      `<p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}

export function verifyCode(rawEmail: string, rawCode: string): string {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.trim();
  const entry = pending.get(email);
  if (!entry) {
    throw new SubmissionError(400, 'No verification code requested for this email.');
  }
  if (Date.now() > entry.expiresAt) {
    pending.delete(email);
    throw new SubmissionError(400, 'Verification code expired. Request a new one.');
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    pending.delete(email);
    throw new SubmissionError(429, 'Too many attempts. Request a new code.');
  }
  entry.attempts += 1;
  if (entry.code !== code) {
    throw new SubmissionError(400, 'Incorrect code.');
  }
  pending.delete(email);
  return jwt.sign({ email, purpose: 'connector-submit' }, config.jwt.secret, { expiresIn: EMAIL_TOKEN_TTL });
}

function verifyEmailToken(token: string): string {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { email?: string; purpose?: string };
    if (decoded.purpose !== 'connector-submit' || !decoded.email) {
      throw new Error('bad purpose');
    }
    return decoded.email;
  } catch {
    throw new SubmissionError(401, 'Email verification expired. Please verify your email again.');
  }
}

function buildIssueBody(p: SubmissionPayload, email: string): string {
  const decl = (ok: boolean) => (ok ? '[x]' : '[ ]');
  return [
    `**Submitter:** ${p.name}`,
    `**GitHub:** @${p.githubUsername}`,
    p.organization ? `**Organization:** ${p.organization}` : null,
    `**Verified email:** ${email}`,
    '',
    `**Connector ID:** \`${p.connectorId}\``,
    `**Category:** ${p.category}`,
    `**Repository:** ${p.repoUrl}`,
    `**Currently working:** ${p.working === 'yes' ? 'Yes' : 'In progress'}`,
    '',
    '**Why it belongs in SATS:**',
    p.rationale,
    '',
    '**Declarations:**',
    `- ${decl(p.declarations.readOnly)} Connector is read-only (cannot send transactions)`,
    `- ${decl(p.declarations.testsPass)} SATS connector test suite passes`,
    `- ${decl(p.declarations.maintain)} Will maintain or transfer ownership`,
    `- ${decl(p.declarations.terms)} Accepts the SATS Connector Network terms`,
    '',
    '---',
    '_Submitted via the SATS Developer Portal._',
  ]
    .filter((l) => l !== null)
    .join('\n');
}

export async function createSubmission(
  p: SubmissionPayload,
): Promise<{ issueUrl: string; issueNumber: number }> {
  if (!isGithubConfigured()) {
    throw new SubmissionError(503, 'Submission intake is not configured.');
  }
  const email = verifyEmailToken(p.emailToken);

  const res = await fetch(`https://api.github.com/repos/${config.github.repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.github.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'afribit-sats',
    },
    body: JSON.stringify({
      title: `Connector submission: ${p.connectorId}`,
      body: buildIssueBody(p, email),
      labels: ['connector-submission'],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[submissions] GitHub issue creation failed', res.status, detail.slice(0, 300));
    throw new SubmissionError(502, 'Could not create the submission issue. Please try again later.');
  }

  const issue = (await res.json()) as { html_url: string; number: number };

  if (isEmailConfigured()) {
    try {
      await getTransporter().sendMail({
        from: config.smtp.from,
        to: email,
        subject: `SATS connector submission received: ${p.connectorId}`,
        text:
          `Thanks for submitting "${p.connectorId}" to the SATS Connector Network.\n\n` +
          `Track your submission here: ${issue.html_url}\n\n` +
          `The Afribit team reviews submissions within 48 hours.`,
        html:
          `<p>Thanks for submitting <strong>${p.connectorId}</strong> to the SATS Connector Network.</p>` +
          `<p>Track your submission: <a href="${issue.html_url}">${issue.html_url}</a></p>` +
          `<p>The Afribit team reviews submissions within 48 hours.</p>`,
      });
    } catch (err) {
      console.error('[submissions] confirmation email failed', err instanceof Error ? err.message : err);
    }
  }

  return { issueUrl: issue.html_url, issueNumber: issue.number };
}
