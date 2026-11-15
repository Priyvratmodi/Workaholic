import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { updatePreferencesSchema, updateProfileSchema } from '@workaholic/shared';
import { sendError } from '../utils/errors.js';

export async function updatePreferences(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const parseResult = updatePreferencesSchema.safeParse(req.body);
  if (!parseResult.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid preferences payload', parseResult.error.format());
  }

  const { themePreference, reduceMotion } = parseResult.data;

  try {
    const updateData: { themePreference?: string; reduceMotion?: boolean } = {};
    if (themePreference !== undefined) updateData.themePreference = themePreference;
    if (reduceMotion !== undefined) updateData.reduceMotion = reduceMotion;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        themePreference: true,
        reduceMotion: true,
      },
    });

    return res.json({
      data: {
        user: updatedUser,
        preferences: {
          themePreference: updatedUser.themePreference,
          reduceMotion: updatedUser.reduceMotion,
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update preferences');
  }
}

export async function updateProfile(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const parseResult = updateProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid profile payload', parseResult.error.format());
  }

  const { name, avatarUrl } = parseResult.data;

  try {
    const updateData: { name?: string; avatarUrl?: string | null } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        themePreference: true,
        reduceMotion: true,
      },
    });

    return res.json({
      data: { user: updatedUser },
    });
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update profile');
  }
}

export async function getUserActivity(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  try {
    const activities = await prisma.activity.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    const formatted = activities.map((act) => ({
      ...act,
      payload: JSON.parse(act.payload || '{}'),
      createdAt: act.createdAt.toISOString(),
    }));

    return res.json({
      data: { activities: formatted },
    });
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch user activity');
  }
}

export async function getUserCards(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  try {
    const cardMembers = await prisma.cardMember.findMany({
      where: { userId: req.user.id },
      include: {
        card: {
          include: {
            list: {
              include: {
                board: {
                  select: {
                    id: true,
                    title: true,
                    background: true,
                  },
                },
              },
            },
            labels: {
              include: {
                label: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            checklists: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    // Group cards by board
    const boardMap = new Map<string, { board: any; cards: any[] }>();

    for (const cm of cardMembers) {
      const card = cm.card;
      if (!card || !card.list || !card.list.board) continue;
      const board = card.list.board;
      if (!boardMap.has(board.id)) {
        boardMap.set(board.id, { board, cards: [] });
      }

      boardMap.get(board.id)!.cards.push({
        id: card.id,
        listId: card.listId,
        listTitle: card.list.title,
        title: card.title,
        description: card.description,
        startDate: card.startDate?.toISOString() || null,
        dueDate: card.dueDate?.toISOString() || null,
        position: card.position,
        isComplete: card.isComplete,
        labels: card.labels.map((cl) => cl.label),
        members: card.members.map((m) => m.user),
        checklistsCount: card.checklists.length,
        checklistsCompletedCount: card.checklists.reduce(
          (acc, cl) => acc + cl.items.filter((i) => i.isDone).length,
          0
        ),
        checklistsTotalItems: card.checklists.reduce((acc, cl) => acc + cl.items.length, 0),
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
      });
    }

    const grouped = Array.from(boardMap.values());

    return res.json({
      data: { groupedCards: grouped },
    });
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch user cards');
  }
}
