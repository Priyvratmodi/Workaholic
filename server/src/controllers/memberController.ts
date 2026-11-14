import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { sendError, AppError } from '../utils/errors.js';
import { Role } from '@workaholic/shared';

export async function getMembers(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;

  const members = await prisma.boardMember.findMany({
    where: { boardId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json({
    members: members.map((m) => ({
      id: m.id,
      boardId: m.boardId,
      userId: m.userId,
      role: m.role as Role,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    })),
  });
}

export async function inviteMember(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;
  const { email, role } = req.body;

  // Look up user by email
  const targetUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  if (!targetUser) {
    return sendError(
      res,
      404,
      'USER_NOT_FOUND',
      `No user found with email ${email}. They must register first.`
    );
  }

  // Upsert board membership
  const membership = await prisma.boardMember.upsert({
    where: {
      boardId_userId: {
        boardId,
        userId: targetUser.id,
      },
    },
    create: {
      boardId,
      userId: targetUser.id,
      role: role || 'member',
    },
    update: {
      role: role || 'member',
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  await prisma.activity.create({
    data: {
      boardId,
      userId: req.user.id,
      type: 'member_added',
      payload: JSON.stringify({
        user: req.user.name,
        targetUser: targetUser.name,
        role: membership.role,
      }),
    },
  });

  res.status(201).json({
    member: {
      id: membership.id,
      boardId: membership.boardId,
      userId: membership.userId,
      role: membership.role as Role,
      createdAt: membership.createdAt.toISOString(),
      user: membership.user,
    },
  });
}

export async function updateMemberRole(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;
  const targetUserId = req.params.userId;
  const { role } = req.body;

  // Find target membership
  const currentMembership = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId: targetUserId,
      },
    },
  });

  if (!currentMembership) {
    return sendError(res, 404, 'NOT_FOUND', 'Board member not found');
  }

  // Last-owner guard: if demoting an owner
  if (currentMembership.role === 'owner' && role !== 'owner') {
    const ownerCount = await prisma.boardMember.count({
      where: { boardId, role: 'owner' },
    });

    if (ownerCount <= 1) {
      return sendError(
        res,
        400,
        'LAST_OWNER_PROTECTED',
        'Cannot remove or demote the last owner of a board. Promote another member to owner first.'
      );
    }
  }

  const updated = await prisma.boardMember.update({
    where: {
      boardId_userId: {
        boardId,
        userId: targetUserId,
      },
    },
    data: { role },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  await prisma.activity.create({
    data: {
      boardId,
      userId: req.user.id,
      type: 'role_updated',
      payload: JSON.stringify({
        user: req.user.name,
        targetUser: updated.user.name,
        role: updated.role,
      }),
    },
  });

  res.json({
    member: {
      id: updated.id,
      boardId: updated.boardId,
      userId: updated.userId,
      role: updated.role as Role,
      createdAt: updated.createdAt.toISOString(),
      user: updated.user,
    },
  });
}

export async function removeMember(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;
  const targetUserId = req.params.userId;

  // Authorization: must be board owner OR self leaving
  const isOwner = req.boardMembership?.role === 'owner';
  const isSelf = targetUserId === req.user.id;

  if (!isOwner && !isSelf) {
    return sendError(
      res,
      403,
      'FORBIDDEN',
      'Only the board owner can remove other members'
    );
  }

  const currentMembership = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId: targetUserId,
      },
    },
  });

  if (!currentMembership) {
    return sendError(res, 404, 'NOT_FOUND', 'Board member not found');
  }

  // Last-owner guard
  if (currentMembership.role === 'owner') {
    const ownerCount = await prisma.boardMember.count({
      where: { boardId, role: 'owner' },
    });

    if (ownerCount <= 1) {
      return sendError(
        res,
        400,
        'LAST_OWNER_PROTECTED',
        'Cannot remove the last owner of a board. Promote another member to owner first.'
      );
    }
  }

  await prisma.boardMember.delete({
    where: {
      boardId_userId: {
        boardId,
        userId: targetUserId,
      },
    },
  });

  await prisma.activity.create({
    data: {
      boardId,
      userId: req.user.id,
      type: 'member_removed',
      payload: JSON.stringify({
        user: req.user.name,
        targetUserId,
      }),
    },
  });

  res.json({ message: 'Member removed from board successfully' });
}
