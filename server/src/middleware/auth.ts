import { Request, Response, NextFunction } from 'express';
import { verifyToken, COOKIE_NAME } from '../utils/jwt.js';
import { prisma } from '../db.js';
import { sendError } from '../utils/errors.js';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  themePreference: string;
  reduceMotion: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.[COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const payload = verifyToken(token);
  if (!payload) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        themePreference: true,
        reduceMotion: true,
      },
    });

    if (!user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Authentication failed');
  }
}
