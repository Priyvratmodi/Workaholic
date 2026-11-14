import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { sendError } from '../utils/errors.js';
import { Role, PermissionAction, hasPermission } from '@workaholic/shared';

declare global {
  namespace Express {
    interface Request {
      boardMembership?: {
        boardId: string;
        userId: string;
        role: Role;
      };
    }
  }
}

/**
 * Resolves the parent board ID from request parameters.
 * Can resolve from:
 * - req.params.boardId
 * - req.params.id (if board route)
 * - req.params.listId or req.params.id (if list route)
 * - req.params.cardId or req.params.id (if card route)
 * - req.params.checklistId, req.params.commentId, etc.
 */
async function resolveBoardId(req: Request): Promise<string | null> {
  if (req.params.boardId) {
    return req.params.boardId;
  }

  // Check if route is directly on /boards/:id
  if (req.baseUrl.includes('/boards') && req.params.id) {
    return req.params.id;
  }

  // Check if listId parameter or list route /lists/:id
  const targetListId = req.params.listId || (req.baseUrl.includes('/lists') ? req.params.id : null);
  if (targetListId) {
    const list = await prisma.list.findUnique({
      where: { id: targetListId },
      select: { boardId: true },
    });
    return list?.boardId ?? null;
  }

  // Check if cardId parameter or card route /cards/:id
  const targetCardId = req.params.cardId || (req.baseUrl.includes('/cards') ? req.params.id : null);
  if (targetCardId) {
    const card = await prisma.card.findUnique({
      where: { id: targetCardId },
      select: { list: { select: { boardId: true } } },
    });
    return card?.list?.boardId ?? null;
  }

  // Check if checklistId parameter or checklist route /checklists/:id
  const targetChecklistId = req.params.checklistId || (req.baseUrl.includes('/checklists') ? req.params.id : null);
  if (targetChecklistId) {
    const cl = await prisma.checklist.findUnique({
      where: { id: targetChecklistId },
      select: { card: { select: { list: { select: { boardId: true } } } } },
    });
    return cl?.card?.list?.boardId ?? null;
  }

  // Check if comment route /comments/:id
  if (req.baseUrl.includes('/comments') && req.params.id) {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      select: { card: { select: { list: { select: { boardId: true } } } } },
    });
    return comment?.card?.list?.boardId ?? null;
  }

  // Check if checklist-items route /checklist-items/:id
  if (req.baseUrl.includes('/checklist-items') && req.params.id) {
    const item = await prisma.checklistItem.findUnique({
      where: { id: req.params.id },
      select: { checklist: { select: { card: { select: { list: { select: { boardId: true } } } } } } },
    });
    return item?.checklist?.card?.list?.boardId ?? null;
  }

  return null;
}

/**
 * RBAC Middleware factory. Enforces required permission for the resolved board.
 * Returns 404 if not found or user is not a member.
 * Returns 403 if user lacks required permission.
 */
export function requireBoardPermission(action: PermissionAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    }

    const boardId = await resolveBoardId(req);
    if (!boardId) {
      return sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    }

    const membership = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      // Return 404 (not 403) if user is not a member to avoid leaking board existence
      return sendError(res, 404, 'NOT_FOUND', 'Board not found');
    }

    const userRole = membership.role as Role;
    if (!hasPermission(userRole, action)) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        `You do not have permission to perform this action (${action})`
      );
    }

    req.boardMembership = {
      boardId,
      userId: req.user.id,
      role: userRole,
    };

    next();
  };
}
