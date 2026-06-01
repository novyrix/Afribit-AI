import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { query, queryOne } from '../db/client';

export type SessionPayload = {
  sessionId: string;
  iat?: number;
  exp?: number;
};

export function signSessionToken(sessionId: string): string {
  return jwt.sign({ sessionId } as SessionPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, config.jwt.secret) as SessionPayload;
}

export async function createSession(language = 'sw'): Promise<string> {
  const id = randomUUID();
  await query(
    `INSERT INTO sessions (id, language) VALUES ($1, $2)`,
    [id, language]
  );
  return id;
}

export async function touchSession(sessionId: string): Promise<void> {
  await query(
    `UPDATE sessions SET last_seen_at = NOW() WHERE id = $1`,
    [sessionId]
  );
}

export async function getSession(sessionId: string) {
  return queryOne<{ id: string; language: string; created_at: Date }>(
    `SELECT id, language, created_at FROM sessions WHERE id = $1`,
    [sessionId]
  );
}

export async function setSessionLanguage(sessionId: string, lang: string) {
  await query(
    `UPDATE sessions SET language = $1 WHERE id = $2`,
    [lang, sessionId]
  );
}
