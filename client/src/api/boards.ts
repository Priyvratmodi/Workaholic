import { apiRequest } from './client.js';
import { BoardSummary, BoardBundle, TemplateDefinition, LabelInfo, AIBoardSummary } from '@workaholic/shared';

export async function fetchBoards(): Promise<BoardSummary[]> {
  const res = await apiRequest<{ boards: BoardSummary[] }>('/api/boards');
  return res.boards;
}

export async function fetchBoardById(id: string): Promise<BoardBundle> {
  const res = await apiRequest<{ board: BoardBundle }>(`/api/boards/${id}`);
  return res.board;
}

export async function createBoard(data: {
  title: string;
  templateId?: string;
  background?: string;
}): Promise<any> {
  const res = await apiRequest<{ board: any }>('/api/boards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.board;
}

export async function updateBoard(
  id: string,
  data: { title?: string; background?: string }
): Promise<any> {
  const res = await apiRequest<{ board: any }>(`/api/boards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.board;
}

export async function deleteBoard(id: string): Promise<void> {
  await apiRequest(`/api/boards/${id}`, {
    method: 'DELETE',
  });
}

export async function starBoard(id: string): Promise<boolean> {
  const res = await apiRequest<{ isStarred: boolean }>(`/api/boards/${id}/star`, {
    method: 'POST',
  });
  return res.isStarred;
}

export async function unstarBoard(id: string): Promise<boolean> {
  const res = await apiRequest<{ isStarred: boolean }>(`/api/boards/${id}/star`, {
    method: 'DELETE',
  });
  return res.isStarred;
}

export async function fetchTemplates(): Promise<TemplateDefinition[]> {
  const res = await apiRequest<{ templates: TemplateDefinition[] }>('/api/templates');
  return res.templates;
}

export async function createBoardLabel(
  boardId: string,
  data: { name?: string | null; color: string }
): Promise<LabelInfo> {
  const res = await apiRequest<{ label: LabelInfo }>(`/api/boards/${boardId}/labels`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.label;
}

export async function deleteBoardLabel(
  boardId: string,
  labelId: string
): Promise<void> {
  await apiRequest(`/api/boards/${boardId}/labels/${labelId}`, {
    method: 'DELETE',
  });
}

export async function fetchAIBoardSummary(boardId: string, apiKey?: string): Promise<AIBoardSummary> {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['X-Gemini-Api-Key'] = apiKey;
  }
  const res = await apiRequest<{ summary: AIBoardSummary }>(`/api/boards/${boardId}/ai-summary`, {
    headers,
  });
  return res.summary;
}

