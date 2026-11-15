import jwt from 'jsonwebtoken';
import { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'workaholic_jwt_secret_dev_key';
const COOKIE_NAME = 'workaholic_token';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = (process.env.COOKIE_SAME_SITE as 'lax' | 'none' | 'strict') || (isProduction ? 'none' : 'lax');
  const secure = isProduction ? true : sameSite === 'none';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = (process.env.COOKIE_SAME_SITE as 'lax' | 'none' | 'strict') || (isProduction ? 'none' : 'lax');
  const secure = isProduction ? true : sameSite === 'none';

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  });
}

export { COOKIE_NAME };
