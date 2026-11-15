import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db.js';
import { sendError } from '../utils/errors.js';
import { AIBoardSummary, AttentionItem, ListBreakdown, ListBreakdownCard } from '@workaholic/shared';

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function resolveApiKey(req: Request): string | undefined {
  // 1. Check custom request header
  const headerKey = req.headers['x-gemini-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    process.env.GEMINI_API_KEY = headerKey.trim();
    return headerKey.trim();
  }

  // 2. Check request body
  if (req.body && typeof req.body.apiKey === 'string' && req.body.apiKey.trim()) {
    process.env.GEMINI_API_KEY = req.body.apiKey.trim();
    return req.body.apiKey.trim();
  }

  // 3. Check environment variables
  const envKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  // 4. Fallback: dynamically read .env or server/.env
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'server/.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), '../server/.env'),
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
        if (match && match[1]) {
          process.env.GEMINI_API_KEY = match[1].trim();
          return match[1].trim();
        }
      }
    } catch { }
  }

  return undefined;
}

function calculateHeuristicSummary(board: any, apiKeyPresent: boolean): AIBoardSummary {
  const now = new Date();
  const allCards: Array<{
    id: string;
    title: string;
    listTitle: string;
    listId: string;
    dueDate: Date | null;
    isComplete: boolean;
    labels: string[];
    assignees: Array<{ id: string; name: string }>;
  }> = [];

  const listBreakdowns: ListBreakdown[] = [];

  let doneCount = 0;
  let blockerCount = 0;
  let overdueCount = 0;

  for (const list of board.lists) {
    const listCards: ListBreakdownCard[] = [];

    for (const card of list.cards) {
      const labels = card.labels.map((l: any) => (l.label?.name || '').toLowerCase());
      const assignees = card.members.map((m: any) => ({
        id: m.user.id,
        name: m.user.name,
      }));
      const dueDate = card.dueDate ? new Date(card.dueDate) : null;
      const isComplete = Boolean(card.isComplete);

      const isDone = isComplete || list.title.toLowerCase().includes('done') || list.title.toLowerCase().includes('shipped');
      const isBlocked = labels.some((l: string) => l.includes('block')) || list.title.toLowerCase().includes('block');
      const isOverdue = !isDone && dueDate && dueDate.getTime() < now.getTime();

      if (isDone) doneCount++;
      if (isBlocked) blockerCount++;
      if (isOverdue) overdueCount++;

      allCards.push({
        id: card.id,
        title: card.title,
        listTitle: list.title,
        listId: list.id,
        dueDate,
        isComplete: isDone,
        labels,
        assignees,
      });

      let tag: string | undefined;
      let tagColor: 'red' | 'amber' | 'green' | 'default' = 'default';

      if (isBlocked) {
        tag = 'Blocked';
        tagColor = 'red';
      } else if (isOverdue) {
        tag = 'Overdue';
        tagColor = 'red';
      } else if (dueDate) {
        tag = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        tagColor = 'amber';
      } else if (isDone) {
        tag = 'Done';
        tagColor = 'green';
      }

      const primaryAssignee = assignees[0];

      listCards.push({
        id: card.id,
        title: card.title,
        tag,
        tagColor,
        assigneeName: primaryAssignee?.name,
        assigneeInitials: primaryAssignee ? getInitials(primaryAssignee.name) : undefined,
        isUnassigned: assignees.length === 0,
      });
    }

    listBreakdowns.push({
      listId: list.id,
      title: `${list.emoji ? `${list.emoji} ` : ''}${list.title}`,
      count: list.cards.length,
      summary: `Contains ${list.cards.length} task${list.cards.length === 1 ? '' : 's'} in ${list.title.toLowerCase()}`,
      cards: listCards.slice(0, 3),
    });
  }

  // Attention items
  const attentionItems: AttentionItem[] = [];

  // 1. Overdue cards
  for (const card of allCards) {
    if (!card.isComplete && card.dueDate && card.dueDate.getTime() < now.getTime()) {
      const daysOverdue = Math.max(1, Math.round((now.getTime() - card.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      attentionItems.push({
        cardId: card.id,
        title: card.title,
        details: `overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'}, ${card.assignees.length ? `assigned to ${card.assignees.map(a => a.name).join(', ')}` : 'no owner'}`,
        badge: `Overdue ${daysOverdue}d`,
        severity: 'high',
      });
    }
  }

  // 2. Blocked cards
  for (const card of allCards) {
    if (!card.isComplete && (card.labels.some(l => l.includes('block')) || card.listTitle.toLowerCase().includes('block'))) {
      if (!attentionItems.some(item => item.cardId === card.id)) {
        attentionItems.push({
          cardId: card.id,
          title: card.title,
          details: `blocked in ${card.listTitle}${card.assignees.length ? ` (${card.assignees[0].name})` : ', unassigned'}`,
          badge: 'Blocked',
          severity: 'high',
        });
      }
    }
  }

  // 3. Unassigned cards in active lists
  for (const card of allCards) {
    if (!card.isComplete && card.assignees.length === 0 && !attentionItems.some(item => item.cardId === card.id)) {
      if (card.listTitle.toLowerCase().includes('to do') || card.listTitle.toLowerCase().includes('progress')) {
        attentionItems.push({
          cardId: card.id,
          title: card.title,
          details: `unassigned task in ${card.listTitle}`,
          badge: 'Unassigned',
          severity: 'medium',
        });
      }
    }
  }

  // Overview narrative
  let overviewNarrative = '';
  const recommendations: string[] = [];

  if (allCards.length === 0) {
    overviewNarrative = 'No tasks found on this board yet. Add lists and cards to get workflow analysis and sprint summaries.';
  } else {
    overviewNarrative = `Board contains ${allCards.length} tasks across ${board.lists.length} swimlanes. ${doneCount} tasks are completed. `;
    if (blockerCount > 0 && overdueCount > 0) {
      overviewNarrative += `Attention needed: ${blockerCount} blocker${blockerCount > 1 ? 's' : ''} and ${overdueCount} overdue item${overdueCount > 1 ? 's' : ''} require resolution to maintain sprint velocity.`;
    } else if (blockerCount > 0) {
      overviewNarrative += `Attention needed: ${blockerCount} blocker${blockerCount > 1 ? 's' : ''} detected on the board.`;
    } else if (overdueCount > 0) {
      overviewNarrative += `Notice: ${overdueCount} overdue item${overdueCount > 1 ? 's' : ''} need review or rescheduling.`;
    } else {
      overviewNarrative += `Work is progressing on schedule with zero active blockers.`;
    }

    if (blockerCount > 0) {
      recommendations.push(`Triage and resolve ${blockerCount} blocked item${blockerCount > 1 ? 's' : ''} to restore team velocity.`);
    }
    if (overdueCount > 0) {
      recommendations.push(`Review due dates on ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} and assign dedicated owners.`);
    }
    if (allCards.filter(c => c.assignees.length === 0 && !c.isComplete).length > 0) {
      recommendations.push('Assign clear ownership to unassigned work items in active swimlanes.');
    }
  }

  return {
    overviewNarrative,
    situationAssessment: blockerCount > 0 ? 'Sprint velocity impeded by active blockers.' : 'Sprint progressing normally.',
    recommendations,
    doneCount,
    blockerCount,
    overdueCount,
    totalCards: allCards.length,
    attentionItems: attentionItems.slice(0, 5),
    listBreakdowns,
    generatedAt: new Date().toISOString(),
    isAIGenerated: false,
    apiKeyConfigured: apiKeyPresent,
  };
}

async function callGemini(apiKey: string, prompt: string): Promise<any> {
  const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Gemini model ${model} HTTP ${response.status}: ${errorText}`);
        console.warn(`[AISummary] ${lastError.message}`);
        continue;
      }

      const data = await response.json();
      const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) {
        lastError = new Error(`Empty content returned by model ${model}`);
        continue;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(textContent);
      } catch {
        const match = textContent.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      if (parsed && (parsed.overviewNarrative || parsed.overview)) {
        return parsed;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[AISummary] Attempt with ${model} failed: ${err.message}`);
    }
  }

  throw lastError || new Error('All Gemini models failed to generate response');
}

export async function getBoardAISummary(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const boardId = req.params.id;
  const userId = req.user.id;

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
            },
          },
        },
      },
    },
  });

  if (!board) {
    return sendError(res, 404, 'NOT_FOUND', 'Board not found');
  }

  const apiKey = resolveApiKey(req);
  const fallbackSummary = calculateHeuristicSummary(board, Boolean(apiKey));

  if (!apiKey || fallbackSummary.totalCards === 0) {
    return res.json({ summary: fallbackSummary });
  }

  try {
    const boardContext = {
      title: board.title,
      today: new Date().toISOString().split('T')[0],
      totalCards: fallbackSummary.totalCards,
      lists: board.lists.map(list => ({
        id: list.id,
        title: `${list.emoji ? `${list.emoji} ` : ''}${list.title}`,
        cardCount: list.cards.length,
        cards: list.cards.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          dueDate: c.dueDate,
          isComplete: c.isComplete,
          labels: c.labels.map(l => l.label?.name).filter(Boolean),
          assignees: c.members.map(m => m.user.name),
        })),
      })),
    };

    const prompt = `You are a Principal Agile Delivery Lead and Technical Program Manager.
Analyze the following live Kanban board data and provide a comprehensive, executive-level situation diagnosis.

Board Context:
${JSON.stringify(boardContext, null, 2)}

Instructions:
1. overviewNarrative: Write an insightful, articulate executive narrative (3-4 sentences) that clearly explains the CURRENT SITUATION of the board: overall sprint health, delivery momentum, key accomplishments, critical bottlenecks, and operational risks.
2. situationAssessment: A punchy 1-2 sentence bottom-line assessment of sprint health (e.g., "Sprint at Moderate Risk: Front-end execution is solid with 6 completed user stories, but 2 high-priority blockers in external integrations threaten scheduled release.").
3. recommendations: 3-4 concrete, prioritized, actionable steps the team should take immediately.
4. doneCount: Total number of completed cards.
5. blockerCount: Total number of blocked tasks.
6. overdueCount: Incomplete tasks where dueDate is before today (${boardContext.today}).
7. attentionItems: Up to 5 specific items needing immediate attention (card title, detailed explanation of why it is at risk, short badge like "Blocked", "Overdue 3d", or "Unassigned", and severity "high"|"medium"|"low"). Include cardId if available.
8. listBreakdowns: Summarize each swimlane with count, one concise diagnosis sentence, and notable highlight cards.

Return strictly valid JSON matching this schema:
{
  "overviewNarrative": "...",
  "situationAssessment": "...",
  "recommendations": ["...", "..."],
  "doneCount": 0,
  "blockerCount": 0,
  "overdueCount": 0,
  "attentionItems": [
    {
      "cardId": "string",
      "title": "string",
      "details": "string",
      "badge": "string",
      "severity": "high"
    }
  ],
  "listBreakdowns": [
    {
      "listId": "string",
      "title": "string",
      "count": 0,
      "summary": "string",
      "cards": [
        {
          "id": "string",
          "title": "string",
          "tag": "string",
          "tagColor": "red|amber|green|default",
          "assigneeName": "string",
          "assigneeInitials": "string",
          "isUnassigned": false
        }
      ]
    }
  ]
}`;

    const parsed = await callGemini(apiKey, prompt);

    const aiSummary: AIBoardSummary = {
      overviewNarrative: parsed.overviewNarrative || parsed.overview || fallbackSummary.overviewNarrative,
      situationAssessment: parsed.situationAssessment || fallbackSummary.situationAssessment,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : fallbackSummary.recommendations,
      doneCount: typeof parsed.doneCount === 'number' ? parsed.doneCount : fallbackSummary.doneCount,
      blockerCount: typeof parsed.blockerCount === 'number' ? parsed.blockerCount : fallbackSummary.blockerCount,
      overdueCount: typeof parsed.overdueCount === 'number' ? parsed.overdueCount : fallbackSummary.overdueCount,
      totalCards: fallbackSummary.totalCards,
      attentionItems: Array.isArray(parsed.attentionItems) ? parsed.attentionItems : fallbackSummary.attentionItems,
      listBreakdowns: Array.isArray(parsed.listBreakdowns) && parsed.listBreakdowns.length > 0
        ? parsed.listBreakdowns
        : fallbackSummary.listBreakdowns,
      generatedAt: new Date().toISOString(),
      isAIGenerated: true,
      apiKeyConfigured: true,
    };

    return res.json({ summary: aiSummary });
  } catch (err: any) {
    console.error(`[AISummary] Gemini error: ${err.message}. Using heuristic fallback.`);
    return res.json({ summary: { ...fallbackSummary, apiKeyConfigured: true } });
  }
}
