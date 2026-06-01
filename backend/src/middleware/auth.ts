import type { Request, Response, NextFunction } from 'express';
import { verifySessionToken, touchSession } from '../utils/session';

export function requireSession(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'No session token provided' });
    return;
  }

  try {
    const payload = verifySessionToken(token);
    (req as Request & { sessionId: string }).sessionId = payload.sessionId;
    touchSession(payload.sessionId).catch(() => {}); // fire-and-forget
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      sessionId: string;
    }
  }
}
