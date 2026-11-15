import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db.js';
import { sendError } from '../utils/errors.js';
import { uploadsDir } from '../utils/upload.js';
import { getPositionBetween, CardInfo, CommentInfo, ActivityInfo } from '@workaholic/shared';

export async function getCardDetails(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.id;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: {
        select: {
          id: true,
          boardId: true,
          title: true,
        },
      },
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
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!card) {
    return sendError(res, 404, 'NOT_FOUND', 'Card not found');
  }

  const comments: CommentInfo[] = card.comments.map((cm) => ({
    id: cm.id,
    cardId: cm.cardId,
    userId: cm.userId,
    body: cm.body,
    createdAt: cm.createdAt.toISOString(),
    updatedAt: cm.updatedAt.toISOString(),
    user: cm.user,
  }));

  const activities: ActivityInfo[] = card.activities.map((act) => {
    let payload = {};
    try {
      payload = JSON.parse(act.payload);
    } catch {
      payload = { raw: act.payload };
    }
    return {
      id: act.id,
      boardId: act.boardId,
      cardId: act.cardId,
      userId: act.userId,
      type: act.type,
      payload,
      createdAt: act.createdAt.toISOString(),
      user: act.user,
    };
  });

  const cardInfo: CardInfo = {
    id: card.id,
    listId: card.listId,
    title: card.title,
    description: card.description,
    startDate: card.startDate ? card.startDate.toISOString() : null,
    dueDate: card.dueDate ? card.dueDate.toISOString() : null,
    position: card.position,
    isComplete: card.isComplete,
    coverColor: card.coverColor,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    members: card.members.map((m) => m.user),
    labels: card.labels.map((l) => ({
      id: l.label.id,
      boardId: l.label.boardId,
      name: l.label.name,
      color: l.label.color,
    })),
    checklists: card.checklists.map((ck) => ({
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
    attachments: card.attachments.map((at) => ({
      id: at.id,
      cardId: at.cardId,
      name: at.name,
      url: at.url,
      size: at.size,
      mimeType: at.mimeType,
      createdAt: at.createdAt.toISOString(),
    })),
    commentsCount: card.comments.length,
    comments,
    activities,
  };

  res.json({ card: cardInfo, listTitle: card.list.title, boardId: card.list.boardId });
}

// Checklist Actions
export async function createChecklist(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.cardId;
  const { title } = req.body;

  const lastChecklist = await prisma.checklist.findFirst({
    where: { cardId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const position = getPositionBetween(lastChecklist?.position, null);

  const checklist = await prisma.checklist.create({
    data: {
      cardId,
      title: title || 'Checklist',
      position,
    },
    include: {
      items: true,
    },
  });

  res.status(201).json({
    checklist: {
      id: checklist.id,
      cardId: checklist.cardId,
      title: checklist.title,
      position: checklist.position,
      items: [],
    },
  });
}

export async function deleteChecklist(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const checklistId = req.params.id;

  await prisma.checklist.delete({
    where: { id: checklistId },
  });

  res.json({ message: 'Checklist deleted successfully' });
}

export async function addChecklistItem(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const checklistId = req.params.checklistId;
  const { text } = req.body;

  const lastItem = await prisma.checklistItem.findFirst({
    where: { checklistId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const position = getPositionBetween(lastItem?.position, null);

  const item = await prisma.checklistItem.create({
    data: {
      checklistId,
      text: text.trim(),
      position,
    },
  });

  res.status(201).json({
    item: {
      id: item.id,
      checklistId: item.checklistId,
      text: item.text,
      isDone: item.isDone,
      position: item.position,
      createdAt: item.createdAt.toISOString(),
    },
  });
}

export async function updateChecklistItem(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const itemId = req.params.id;
  const { text, isDone, position } = req.body;

  const data: Record<string, any> = {};
  if (text !== undefined) data.text = text.trim();
  if (isDone !== undefined) data.isDone = isDone;
  if (position !== undefined) data.position = position;

  const updatedItem = await prisma.checklistItem.update({
    where: { id: itemId },
    data,
  });

  res.json({
    item: {
      id: updatedItem.id,
      checklistId: updatedItem.checklistId,
      text: updatedItem.text,
      isDone: updatedItem.isDone,
      position: updatedItem.position,
      createdAt: updatedItem.createdAt.toISOString(),
    },
  });
}

export async function deleteChecklistItem(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const itemId = req.params.id;

  await prisma.checklistItem.delete({
    where: { id: itemId },
  });

  res.json({ message: 'Checklist item deleted successfully' });
}

// Comments Actions
export async function addComment(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.cardId;
  const { body } = req.body;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: { select: { boardId: true } } },
  });

  if (!card) {
    return sendError(res, 404, 'NOT_FOUND', 'Card not found');
  }

  const comment = await prisma.comment.create({
    data: {
      cardId,
      userId: req.user.id,
      body: body.trim(),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  await prisma.activity.create({
    data: {
      boardId: card.list.boardId,
      cardId,
      userId: req.user.id,
      type: 'comment_added',
      payload: JSON.stringify({
        user: req.user.name,
        cardTitle: card.title,
        commentText: comment.body,
      }),
    },
  });

  const commentInfo: CommentInfo = {
    id: comment.id,
    cardId: comment.cardId,
    userId: comment.userId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    user: comment.user,
  };

  res.status(201).json({ comment: commentInfo });
}

export async function deleteComment(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const commentId = req.params.id;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) {
    return sendError(res, 404, 'NOT_FOUND', 'Comment not found');
  }

  // Only author or board owner can delete
  const isAuthor = comment.userId === req.user.id;
  const isOwner = req.boardMembership?.role === 'owner';

  if (!isAuthor && !isOwner) {
    return sendError(res, 403, 'FORBIDDEN', 'You cannot delete this comment');
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  res.json({ message: 'Comment deleted successfully' });
}

// Members Assignment
export async function assignMember(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.cardId;
  const { userId } = req.body;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  if (!targetUser) {
    return sendError(res, 404, 'NOT_FOUND', 'User not found');
  }

  await prisma.cardMember.upsert({
    where: {
      cardId_userId: {
        cardId,
        userId,
      },
    },
    create: {
      cardId,
      userId,
    },
    update: {},
  });

  res.status(201).json({ user: targetUser });
}

export async function unassignMember(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.cardId;
  const userId = req.params.userId;

  try {
    await prisma.cardMember.delete({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });
  } catch {
    // Ignore if not assigned
  }

  res.json({ message: 'Member unassigned' });
}

// Labels Assignment
export async function assignLabel(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.cardId;
  const { labelId } = req.body;

  const label = await prisma.label.findUnique({
    where: { id: labelId },
  });

  if (!label) {
    return sendError(res, 404, 'NOT_FOUND', 'Label not found');
  }

  await prisma.cardLabel.upsert({
    where: {
      cardId_labelId: {
        cardId,
        labelId,
      },
    },
    create: {
      cardId,
      labelId,
    },
    update: {},
  });

  res.status(201).json({
    label: {
      id: label.id,
      boardId: label.boardId,
      name: label.name,
      color: label.color,
    },
  });
}

export async function unassignLabel(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.cardId;
  const labelId = req.params.labelId;

  try {
    await prisma.cardLabel.delete({
      where: {
        cardId_labelId: {
          cardId,
          labelId,
        },
      },
    });
  } catch {
    // Ignore if not assigned
  }

  res.json({ message: 'Label unassigned' });
}

// Attachments
export async function addAttachment(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.cardId;
  const { name, url, size, mimeType } = req.body;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: { select: { boardId: true } } },
  });

  if (!card) {
    return sendError(res, 404, 'NOT_FOUND', 'Card not found');
  }

  const attachment = await prisma.attachment.create({
    data: {
      cardId,
      name: name.trim(),
      url: url.trim(),
      size: size ?? null,
      mimeType: mimeType ?? null,
    },
  });

  await prisma.activity.create({
    data: {
      boardId: card.list.boardId,
      userId: req.user.id,
      type: 'card_updated',
      payload: JSON.stringify({
        user: req.user.name,
        cardTitle: card.title,
        attachmentName: name.trim(),
        action: 'attachment_added',
      }),
    },
  });

  res.status(201).json({
    attachment: {
      id: attachment.id,
      cardId: attachment.cardId,
      name: attachment.name,
      url: attachment.url,
      size: attachment.size,
      mimeType: attachment.mimeType,
      createdAt: attachment.createdAt.toISOString(),
    },
  });
}

export async function uploadAttachment(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const cardId = req.params.cardId;
  const file = req.file;

  if (!file) {
    return sendError(res, 400, 'BAD_REQUEST', 'No file uploaded');
  }

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: { select: { boardId: true } } },
  });

  if (!card) {
    return sendError(res, 404, 'NOT_FOUND', 'Card not found');
  }

  const url = `/uploads/${file.filename}`;

  const attachment = await prisma.attachment.create({
    data: {
      cardId,
      name: file.originalname,
      url,
      size: file.size,
      mimeType: file.mimetype,
    },
  });

  await prisma.activity.create({
    data: {
      boardId: card.list.boardId,
      userId: req.user.id,
      type: 'card_updated',
      payload: JSON.stringify({
        user: req.user.name,
        cardTitle: card.title,
        attachmentName: file.originalname,
        action: 'attachment_uploaded',
      }),
    },
  });

  res.status(201).json({
    attachment: {
      id: attachment.id,
      cardId: attachment.cardId,
      name: attachment.name,
      url: attachment.url,
      size: attachment.size,
      mimeType: attachment.mimeType,
      createdAt: attachment.createdAt.toISOString(),
    },
  });
}

export async function deleteAttachment(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const attachmentId = req.params.id;

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    return sendError(res, 404, 'NOT_FOUND', 'Attachment not found');
  }

  // Delete physical file if uploaded locally
  if (attachment.url && attachment.url.startsWith('/uploads/')) {
    const filename = path.basename(attachment.url);
    const filePath = path.join(uploadsDir, filename);
    fs.promises.unlink(filePath).catch(() => {
      // Ignore if file was already removed
    });
  }

  await prisma.attachment.delete({
    where: { id: attachmentId },
  });

  res.json({ message: 'Attachment deleted successfully' });
}
