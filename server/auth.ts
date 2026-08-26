import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthSessionPayload, UserRole } from '../src/types.ts';
import { findUserById, findUserByEmail, findUserByRoll } from './db/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'classhq_secure_session_secret_key_2026';
export const SESSION_EXPIRY_SECONDS = 3 * 60 * 60; // 3 hours in seconds

export interface AuthenticatedRequest extends Request {
  user?: AuthSessionPayload;
}

/**
 * Generates a signed JWT session token valid for 3 hours.
 */
export function generateToken(payload: Omit<AuthSessionPayload, 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: SESSION_EXPIRY_SECONDS,
  });
}

/**
 * Verifies a JWT token. Returns decoded payload if valid and unexpired (within 3h), or null if invalid/expired.
 */
export function verifyToken(token: string): AuthSessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthSessionPayload;
    return decoded;
  } catch (err: any) {
    // TokenExpiredError or JsonWebTokenError
    return null;
  }
}

/**
 * Extracts session token from Authorization Header, Cookies, or Query string.
 */
export function extractToken(req: Request): string | null {
  // 1. Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Cookie token (supports iframe preview with sameSite lax)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // 3. Query param token fallback for iframe embeds
  if (req.query && typeof req.query.auth_token === 'string') {
    return req.query.auth_token;
  }

  return null;
}

/**
 * Auth Middleware: Extracts token from request, verifies 3-hour JWT validity,
 * and attaches current user session to req.user if valid.
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = verifyToken(token);
      if (payload && (payload.userId || payload.email)) {
        let user = null;
        if (payload.userId) {
          user = await findUserById(payload.userId);
        }
        if (!user && payload.email) {
          user = await findUserByEmail(payload.email);
        }
        if (!user && payload.rollNumber) {
          user = await findUserByRoll(payload.rollNumber);
        }

        if (user) {
          // Administrators & Class Captains are inherently authorized; Students must be approved
          const isAllowed = user.role === 'admin' || user.role === 'captain' || user.approval === 'approved';
          if (isAllowed) {
            req.user = {
              userId: user.id,
              email: user.email,
              role: user.role,
              fullName: user.fullName,
              rollNumber: user.rollNumber,
              batch: user.batch,
              section: user.section,
              group: user.group,
              approval: user.approval || (user.role === 'admin' ? 'approved' : 'approved'),
              phoneNumber: user.phoneNumber,
              address: user.address,
              assignedBatch: user.assignedBatch || user.batch,
              assignedSection: user.assignedSection || user.section,
            };
          }
        } else if (payload.role === 'admin' || payload.role === 'captain' || payload.approval === 'approved') {
          // Resilient fallback to cryptographically verified JWT payload so page reloads do not log out admins/users
          req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            fullName: payload.fullName,
            rollNumber: payload.rollNumber,
            batch: payload.batch,
            section: payload.section,
            group: payload.group,
            approval: payload.approval || 'approved',
            phoneNumber: payload.phoneNumber,
            address: payload.address,
            assignedBatch: payload.assignedBatch || payload.batch,
            assignedSection: payload.assignedSection || payload.section,
          };
        }
      }
    }
  } catch (err) {
    console.error('[ClassHQ Auth] Middleware verification error:', err);
  }
  next();
}

/**
 * Require Auth Middleware: Rejects unauthenticated requests or expired 3-hour session tokens with 401 Unauthorized.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Session expired or invalid authentication token. Please log in again.',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  next();
}

/**
 * Require Roles Middleware: Ensures request is authenticated AND user possesses one of the allowed roles.
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Session expired or invalid authentication token. Please log in again.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied: Role '${req.user.role}' is not authorized to access this resource.`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

