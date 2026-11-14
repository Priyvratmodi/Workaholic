import { apiRequest } from './client.js';
import { ListInfo } from '@workaholic/shared';

export async function createList(
  boardId: string,
  data: { title: string; emoji?: string | null }
): Promise<ListInfo> {
  const res = await apiRequest<{ list: ListInfo }>(`/api/boards/${boardId}/lists`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.list;
}

export async function updateList(
  listId: string,
  data: {
    title?: string;
    emoji?: string | null;
    position?: string;
    isArchived?: boolean;
  }
): Promise<ListInfo> {
  const res = await apiRequest<{ list: ListInfo }>(`/api/lists/${listId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.list;
}

export async function deleteList(listId: string): Promise<void> {
  await apiRequest(`/api/lists/${listId}`, {
    method: 'DELETE',
  });
}
