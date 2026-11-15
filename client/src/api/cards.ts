import { apiRequest } from './client.js';
import { CardInfo, ChecklistInfo, ChecklistItemInfo, CommentInfo, LabelInfo, UserSummary, AttachmentInfo } from '@workaholic/shared';

export async function fetchCardDetails(cardId: string): Promise<{
  card: CardInfo;
  listTitle: string;
  boardId: string;
}> {
  return await apiRequest(`/api/cards/${cardId}`);
}

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

// Checklist Actions
export async function createChecklist(
  cardId: string,
  title: string
): Promise<ChecklistInfo> {
  const res = await apiRequest<{ checklist: ChecklistInfo }>(
    `/api/cards/${cardId}/checklists`,
    {
      method: 'POST',
      body: JSON.stringify({ title }),
    }
  );
  return res.checklist;
}

export async function deleteChecklist(checklistId: string): Promise<void> {
  await apiRequest(`/api/checklists/${checklistId}`, {
    method: 'DELETE',
  });
}

export async function addChecklistItem(
  checklistId: string,
  text: string
): Promise<ChecklistItemInfo> {
  const res = await apiRequest<{ item: ChecklistItemInfo }>(
    `/api/checklists/${checklistId}/items`,
    {
      method: 'POST',
      body: JSON.stringify({ text }),
    }
  );
  return res.item;
}

export async function updateChecklistItem(
  itemId: string,
  data: { text?: string; isDone?: boolean; position?: string }
): Promise<ChecklistItemInfo> {
  const res = await apiRequest<{ item: ChecklistItemInfo }>(
    `/api/checklist-items/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
  return res.item;
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  await apiRequest(`/api/checklist-items/${itemId}`, {
    method: 'DELETE',
  });
}

// Comment Actions
export async function addComment(
  cardId: string,
  body: string
): Promise<CommentInfo> {
  const res = await apiRequest<{ comment: CommentInfo }>(
    `/api/cards/${cardId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ body }),
    }
  );
  return res.comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiRequest(`/api/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// Member Assignment
export async function assignMember(
  cardId: string,
  userId: string
): Promise<UserSummary> {
  const res = await apiRequest<{ user: UserSummary }>(
    `/api/cards/${cardId}/members`,
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }
  );
  return res.user;
}

export async function unassignMember(
  cardId: string,
  userId: string
): Promise<void> {
  await apiRequest(`/api/cards/${cardId}/members/${userId}`, {
    method: 'DELETE',
  });
}

// Label Assignment
export async function assignLabel(
  cardId: string,
  labelId: string
): Promise<LabelInfo> {
  const res = await apiRequest<{ label: LabelInfo }>(
    `/api/cards/${cardId}/labels`,
    {
      method: 'POST',
      body: JSON.stringify({ labelId }),
    }
  );
  return res.label;
}

export async function unassignLabel(
  cardId: string,
  labelId: string
): Promise<void> {
  await apiRequest(`/api/cards/${cardId}/labels/${labelId}`, {
    method: 'DELETE',
  });
}

// Attachments
export async function addAttachment(
  cardId: string,
  data: { name: string; url: string; size?: number; mimeType?: string }
): Promise<AttachmentInfo> {
  const res = await apiRequest<{ attachment: AttachmentInfo }>(
    `/api/cards/${cardId}/attachments`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  return res.attachment;
}

export async function uploadAttachment(
  cardId: string,
  file: File
): Promise<AttachmentInfo> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiRequest<{ attachment: AttachmentInfo }>(
    `/api/cards/${cardId}/attachments/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  return res.attachment;
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  await apiRequest(`/api/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}

