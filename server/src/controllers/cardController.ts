import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { sendError } from '../utils/errors.js';
import { getPositionBetween, CardInfo } from '@workaholic/shared';

export async function createCard(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const listId = req.params.listId;
  const { title, description } = req.body;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { id: true, boardId: true, title: true },
  });

  if (!list) {
    return sendError(res, 404, 'NOT_FOUND', 'List not found');
  }

  // Find last card in list to get position
  const lastCard = await prisma.card.findFirst({
    where: { listId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const position = getPositionBetween(lastCard?.position, null);

  const card = await prisma.card.create({
    data: {
      listId,
      title: title.trim(),
      description: description?.trim() || null,
      position,
    },
  });

  await prisma.activity.create({
    data: {
      boardId: list.boardId,
      cardId: card.id,
      userId: req.user.id,
      type: 'card_created',
      payload: JSON.stringify({
        user: req.user.name,
        cardTitle: card.title,
        listTitle: list.title,
      }),
    },
  });

  const cardInfo: CardInfo = {
    id: card.id,
    listId: card.listId,
    title: card.title,
    description: card.description,
    startDate: null,
    dueDate: null,
    position: card.position,
    isComplete: card.isComplete,
    coverColor: card.coverColor,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    members: [],
    labels: [],
    checklists: [],
    attachments: [],
    commentsCount: 0,
  };

  res.status(201).json({ card: cardInfo });
}

export async function updateCard(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.id;
  const {
    title,
    description,
    listId,
    position,
    isComplete,
    startDate,
    dueDate,
    coverColor,
  } = req.body;

  const existingCard = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: { select: { boardId: true, title: true } },
    },
  });

  if (!existingCard) {
    return sendError(res, 404, 'NOT_FOUND', 'Card not found');
  }

  const data: Record<string, any> = {};
  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description ? description.trim() : null;
  if (listId !== undefined) data.listId = listId;
  if (position !== undefined) data.position = position;
  if (isComplete !== undefined) data.isComplete = isComplete;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (coverColor !== undefined) data.coverColor = coverColor;

  // Single card update in the database
  const updatedCard = await prisma.card.update({
    where: { id: cardId },
    data,
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
      labels: {
        include: {
          label: true,
        },
      },
      checklists: {
        orderBy: { position: 'asc' },
        include: {
          items: {
            orderBy: { position: 'asc' },
          },
        },
      },
      attachments: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { comments: true },
      },
    },
  });

  // Determine activity type
  let activityType = 'card_updated';
  let activityPayload: Record<string, any> = {
    user: req.user.name,
    cardTitle: updatedCard.title,
    changes: data,
  };

  if (listId && listId !== existingCard.listId) {
    activityType = 'card_moved';
    const destList = await prisma.list.findUnique({
      where: { id: listId },
      select: { title: true },
    });
    activityPayload = {
      user: req.user.name,
      cardTitle: updatedCard.title,
      fromList: existingCard.list.title,
      toList: destList?.title,
    };
  } else if (isComplete !== undefined && isComplete !== existingCard.isComplete) {
    activityType = isComplete ? 'card_completed' : 'card_uncompleted';
  }

  await prisma.activity.create({
    data: {
      boardId: existingCard.list.boardId,
      cardId: updatedCard.id,
      userId: req.user.id,
      type: activityType,
      payload: JSON.stringify(activityPayload),
    },
  });

  const cardInfo: CardInfo = {
    id: updatedCard.id,
    listId: updatedCard.listId,
    title: updatedCard.title,
    description: updatedCard.description,
    startDate: updatedCard.startDate ? updatedCard.startDate.toISOString() : null,
    dueDate: updatedCard.dueDate ? updatedCard.dueDate.toISOString() : null,
    position: updatedCard.position,
    isComplete: updatedCard.isComplete,
    coverColor: updatedCard.coverColor,
    createdAt: updatedCard.createdAt.toISOString(),
    updatedAt: updatedCard.updatedAt.toISOString(),
    members: updatedCard.members.map((cm) => cm.user),
    labels: updatedCard.labels.map((cl) => ({
      id: cl.label.id,
      boardId: cl.label.boardId,
      name: cl.label.name,
      color: cl.label.color,
    })),
    checklists: updatedCard.checklists.map((ck) => ({
      id: ck.id,
      cardId: ck.cardId,
      title: ck.title,
      position: ck.position,
      items: ck.items.map((it) => ({
        id: it.id,
        checklistId: it.checklistId,
        text: it.text,
        isDone: it.isDone,
        position: it.position,
        createdAt: it.createdAt.toISOString(),
      })),
    })),
    attachments: updatedCard.attachments.map((at) => ({
      id: at.id,
      cardId: at.cardId,
      name: at.name,
      url: at.url,
      size: at.size,
      mimeType: at.mimeType,
      createdAt: at.createdAt.toISOString(),
    })),
    commentsCount: updatedCard._count.comments,
  };

  res.json({ card: cardInfo });
}

export async function deleteCard(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.id;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: { select: { boardId: true } },
    },
  });

  if (!card) {
    return sendError(res, 404, 'NOT_FOUND', 'Card not found');
  }

  await prisma.card.delete({
    where: { id: cardId },
  });

  await prisma.activity.create({
    data: {
      boardId: card.list.boardId,
      cardId: null,
      userId: req.user.id,
      type: 'card_deleted',
      payload: JSON.stringify({
        user: req.user.name,
        cardTitle: card.title,
      }),
    },
  });

  res.json({ message: 'Card deleted successfully' });
}
