import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { createBoardFromTemplate } from '../services/boardService.js';
import { sendError } from '../utils/errors.js';
import { BoardSummary, BoardBundle, ActivityInfo, Role } from '@workaholic/shared';

export async function getBoards(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const userId = req.user.id;

  const memberships = await prisma.boardMember.findMany({
    where: { userId },
    include: {
      board: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
          lists: {
            where: { isArchived: false },
            include: {
              cards: {
                select: { id: true, isComplete: true },
              },
            },
          },
          stars: {
            where: { userId },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const boardSummaries: BoardSummary[] = memberships.map((m) => {
    const board = m.board;
    // Active tasks: cards that are not marked isComplete and not in "Done" list
    const activeTasksCount = board.lists
      .filter((l) => !l.title.toLowerCase().includes('done'))
      .reduce((acc, l) => acc + l.cards.filter((c) => !c.isComplete).length, 0);

    return {
      id: board.id,
      title: board.title,
      background: board.background,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
      userRole: m.role as Role,
      isStarred: board.stars.length > 0,
      members: board.members.map((mem) => mem.user),
      activeTasksCount,
    };
  });

  res.json({ boards: boardSummaries });
}

export async function createBoard(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const { title, templateId, background } = req.body;
  const board = await createBoardFromTemplate(
    req.user.id,
    title,
    templateId,
    background
  );

  res.status(201).json({ board });
}

export async function getBoardById(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;
  const userId = req.user.id;

  // Check membership
  const membership = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId,
      },
    },
  });

  if (!membership) {
    return sendError(res, 404, 'NOT_FOUND', 'Board not found');
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      labels: {
        orderBy: { name: 'asc' },
      },
      stars: {
        where: { userId },
      },
      lists: {
        where: { isArchived: false },
        orderBy: { position: 'asc' },
        include: {
          cards: {
            orderBy: { position: 'asc' },
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
          },
        },
      },
    },
  });

  if (!board) {
    return sendError(res, 404, 'NOT_FOUND', 'Board not found');
  }

  const bundle: BoardBundle = {
    id: board.id,
    title: board.title,
    background: board.background,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    userRole: membership.role as Role,
    isStarred: board.stars.length > 0,
    members: board.members.map((m) => ({
      id: m.id,
      boardId: m.boardId,
      userId: m.userId,
      role: m.role as Role,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    })),
    labels: board.labels.map((l) => ({
      id: l.id,
      boardId: l.boardId,
      name: l.name,
      color: l.color,
    })),
    lists: board.lists.map((l) => ({
      id: l.id,
      boardId: l.boardId,
      title: l.title,
      emoji: l.emoji,
      position: l.position,
      isArchived: l.isArchived,
      createdAt: l.createdAt.toISOString(),
      cards: l.cards.map((c) => ({
        id: c.id,
        listId: c.listId,
        title: c.title,
        description: c.description,
        startDate: c.startDate ? c.startDate.toISOString() : null,
        dueDate: c.dueDate ? c.dueDate.toISOString() : null,
        position: c.position,
        isComplete: c.isComplete,
        coverColor: c.coverColor,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        members: c.members.map((cm) => cm.user),
        labels: c.labels.map((cl) => ({
          id: cl.label.id,
          boardId: cl.label.boardId,
          name: cl.label.name,
          color: cl.label.color,
        })),
        checklists: c.checklists.map((ck) => ({
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
        attachments: c.attachments.map((at) => ({
          id: at.id,
          cardId: at.cardId,
          name: at.name,
          url: at.url,
          size: at.size,
          mimeType: at.mimeType,
          createdAt: at.createdAt.toISOString(),
        })),
        commentsCount: c._count.comments,
      })),
    })),
  };

  res.json({ board: bundle });
}

export async function updateBoard(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;
  const { title, background } = req.body;

  const data: Record<string, any> = {};
  if (title !== undefined) data.title = title.trim();
  if (background !== undefined) data.background = background;

  const updatedBoard = await prisma.board.update({
    where: { id: boardId },
    data,
  });

  await prisma.activity.create({
    data: {
      boardId,
      userId: req.user.id,
      type: 'board_updated',
      payload: JSON.stringify({
        user: req.user.name,
        changes: data,
      }),
    },
  });

  res.json({ board: updatedBoard });
}

export async function deleteBoard(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;

  await prisma.board.delete({
    where: { id: boardId },
  });

  res.json({ message: 'Board deleted successfully' });
}

export async function starBoard(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;
  const userId = req.user.id;

  await prisma.boardStar.upsert({
    where: {
      boardId_userId: {
        boardId,
        userId,
      },
    },
    create: {
      userId,
      boardId,
    },
    update: {},
  });

  res.json({ isStarred: true });
}

export async function unstarBoard(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;
  const userId = req.user.id;

  try {
    await prisma.boardStar.delete({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });
  } catch {
    // Ignore if not starred
  }

  res.json({ isStarred: false });
}

export async function getBoardActivity(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;

  const activities = await prisma.activity.findMany({
    where: { boardId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const parsedActivities: ActivityInfo[] = activities.map((act) => {
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

  res.json({ activities: parsedActivities });
}
