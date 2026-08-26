import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'tutorhq_secret_key_3h_session_2026';
export const SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // 3 Hours in milliseconds
export const SESSION_COOKIE_NAME = 'tutorhq_session';

export interface UserSession {
  name: string;
  email: string;
  phone?: string;
  expiresAt: number;
  iat: number;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export function createSessionToken(user: { name: string; email: string; phone?: string }): { token: string; expiresAt: number } {
  const iat = Date.now();
  const expiresAt = iat + SESSION_DURATION_MS;
  const payloadData: UserSession = {
    name: user.name,
    email: user.email.toLowerCase().trim(),
    phone: user.phone || '',
    expiresAt,
    iat,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payloadData)).toString('base64url');
  const signature = sign(payloadB64);
  const token = `${payloadB64}.${signature}`;

  return { token, expiresAt };
}

export function verifySessionToken(token: string | null | undefined): UserSession | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = sign(payloadB64);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const session: UserSession = JSON.parse(payloadStr);

    if (!session.expiresAt || Date.now() > session.expiresAt) {
      return null; // Expired (3h exceeded)
    }

    return session;
  } catch (err) {
    return null;
  }
}
