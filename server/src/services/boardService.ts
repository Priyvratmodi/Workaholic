import { prisma } from '../db.js';
import { generateKeyBetween } from 'fractional-indexing';
import { PROJECT_MANAGEMENT_TEMPLATE, TemplateDefinition, Role } from '@workaholic/shared';
import { AppError } from '../utils/errors.js';

export async function createBoardFromTemplate(
  userId: string,
  title: string,
  templateId?: string,
  background?: string
) {
  // If templateId is provided or defaulted to project management template
  const isDefault = !templateId || templateId === PROJECT_MANAGEMENT_TEMPLATE.id;
  const template: TemplateDefinition = PROJECT_MANAGEMENT_TEMPLATE;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch user to verify and use name
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // 2. Create Board
    const board = await tx.board.create({
      data: {
        title: title.trim(),
        background: background || 'gradient-1',
      },
    });

    // 3. Create Owner Membership
    await tx.boardMember.create({
      data: {
        boardId: board.id,
        userId: user.id,
        role: 'owner',
      },
    });

    if (isDefault) {
      // 4. Create Default Labels
      const labelMap = new Map<string, string>();
      for (const lbl of template.defaultLabels) {
        const createdLabel = await tx.label.create({
          data: {
            boardId: board.id,
            name: lbl.name,
            color: lbl.color,
          },
        });
        labelMap.set(lbl.name, createdLabel.id);
      }

      // 5. Create Lists in exact order with fractional indexing
      let lastListPos: string | null = null;
      for (const listDef of template.lists) {
        const listPos = generateKeyBetween(lastListPos, null);
        lastListPos = listPos;

        const list = await tx.list.create({
          data: {
            boardId: board.id,
            title: listDef.title,
            emoji: listDef.emoji,
            position: listPos,
          },
        });

        // 6. Create starter card with verbatim description
        const cardPos = generateKeyBetween(null, null);
        await tx.card.create({
          data: {
            listId: list.id,
            title: listDef.starterCard.title,
            description: listDef.starterCard.description,
            position: cardPos,
          },
        });
      }
    } else {
      // Blank board: create default labels
      for (const lbl of template.defaultLabels) {
        await tx.label.create({
          data: {
            boardId: board.id,
            name: lbl.name,
            color: lbl.color,
          },
        });
      }
    }

    // 7. Activity entry
    await tx.activity.create({
      data: {
        boardId: board.id,
        userId: user.id,
        type: 'board_created',
        payload: JSON.stringify({ user: user.name, title: board.title }),
      },
    });

    return board;
  });
}
