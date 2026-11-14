import { apiRequest } from './client.js';
import { CardInfo } from '@workaholic/shared';

export async function createCard(
  listId: string,
  data: { title: string; description?: string | null }
): Promise<CardInfo> {
  const res = await apiRequest<{ card: CardInfo }>(`/api/lists/${listId}/cards`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.card;
}

export async function updateCard(
  cardId: string,
  data: {
    title?: string;
    description?: string | null;
    listId?: string;
    position?: string;
    isComplete?: boolean;
    startDate?: string | null;
    dueDate?: string | null;
    coverColor?: string | null;
  }
): Promise<CardInfo> {
  const res = await apiRequest<{ card: CardInfo }>(`/api/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.card;
}

export async function deleteCard(cardId: string): Promise<void> {
  await apiRequest(`/api/cards/${cardId}`, {
    method: 'DELETE',
  });
}
