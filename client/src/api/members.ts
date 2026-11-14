import { apiRequest } from './client.js';
import { BoardMemberInfo, Role } from '@workaholic/shared';

export async function fetchMembers(boardId: string): Promise<BoardMemberInfo[]> {
  const res = await apiRequest<{ members: BoardMemberInfo[] }>(
    `/api/boards/${boardId}/members`
  );
  return res.members;
}

export async function inviteMember(
  boardId: string,
  email: string,
  role: Role
): Promise<BoardMemberInfo> {
  const res = await apiRequest<{ member: BoardMemberInfo }>(
    `/api/boards/${boardId}/members`,
    {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }
  );
  return res.member;
}

export async function updateMemberRole(
  boardId: string,
  userId: string,
  role: Role
): Promise<BoardMemberInfo> {
  const res = await apiRequest<{ member: BoardMemberInfo }>(
    `/api/boards/${boardId}/members/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }
  );
  return res.member;
}

export async function removeMember(
  boardId: string,
  userId: string
): Promise<void> {
  await apiRequest(`/api/boards/${boardId}/members/${userId}`, {
    method: 'DELETE',
  });
}
