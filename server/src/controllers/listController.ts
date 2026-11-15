import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { sendError } from '../utils/errors.js';
import { getPositionBetween } from '@workaholic/shared';

export async function createList(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.boardId;
  const { title, emoji, color } = req.body;

  // Find the list with highest position
  const lastList = await prisma.list.findFirst({
    where: { boardId, isArchived: false },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const position = getPositionBetween(lastList?.position, null);

  const list = await prisma.list.create({
    data: {
      boardId,
      title: title.trim(),
      emoji: emoji || null,
      color: color || null,
      position,
    },
    include: {
      cards: true,
    },
  });

  await prisma.activity.create({
    data: {
      boardId,
      userId: req.user.id,
      type: 'list_created',
      payload: JSON.stringify({
        user: req.user.name,
        listTitle: list.title,
      }),
    },
  });

  res.status(201).json({
    list: {
      ...list,
      createdAt: list.createdAt.toISOString(),
      cards: [],
    },
  });
}

export async function updateList(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const listId = req.params.id;
  const { title, emoji, color, position, isArchived } = req.body;

  const data: Record<string, any> = {};
  if (title !== undefined) data.title = title.trim();
  if (emoji !== undefined) data.emoji = emoji;
  if (color !== undefined) data.color = color;
  if (position !== undefined) data.position = position;
  if (isArchived !== undefined) data.isArchived = isArchived;

  const updatedList = await prisma.list.update({
    where: { id: listId },
    data,
  });

  await prisma.activity.create({
    data: {
      boardId: updatedList.boardId,
      userId: req.user.id,
      type: 'list_updated',
      payload: JSON.stringify({
        user: req.user.name,
        listTitle: updatedList.title,
        changes: data,
      }),
    },
  });

  res.json({
    list: {
      ...updatedList,
      createdAt: updatedList.createdAt.toISOString(),
    },
  });
}

export async function deleteList(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const listId = req.params.id;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { boardId: true, title: true },
  });

  if (!list) {
    return sendError(res, 404, 'NOT_FOUND', 'List not found');
  }

  await prisma.list.delete({
    where: { id: listId },
  });

  await prisma.activity.create({
    data: {
      boardId: list.boardId,
      userId: req.user.id,
      type: 'list_deleted',
      payload: JSON.stringify({
        user: req.user.name,
        listTitle: list.title,
      }),
    },
  });

  res.json({ message: 'List deleted successfully' });
}
