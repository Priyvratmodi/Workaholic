import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { sendError } from '../utils/errors.js';

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return sendError(res, 400, 'USER_EXISTS', 'A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    // Claim any pending invitations for this email
    const pendingInvitations = await prisma.invitation.findMany({
      where: { email: normalizedEmail },
    });

    if (pendingInvitations.length > 0) {
      for (const inv of pendingInvitations) {
        await prisma.boardMember.create({
          data: {
            boardId: inv.boardId,
            userId: user.id,
            role: inv.role,
          },
        });
      }
      await prisma.invitation.deleteMany({
        where: { email: normalizedEmail },
      });
    }

    const token = signToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    return res.status(201).json({
      data: { user },
    });
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Registration failed');
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = signToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    return res.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Login failed');
  }
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  return res.json({
    data: { message: 'Logged out successfully' },
  });
}

export async function getMe(req: Request, res: Response) {
  return res.json({
    data: { user: req.user },
  });
}
