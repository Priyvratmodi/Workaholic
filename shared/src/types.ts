import { Role } from './permissions.js';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface BoardMemberInfo {
  id: string;
  boardId: string;
  userId: string;
  role: Role;
  createdAt: string;
  user: UserSummary;
}

export interface LabelInfo {
  id: string;
  boardId: string;
  name: string | null;
  color: string;
}

export interface ChecklistItemInfo {
  id: string;
  checklistId: string;
  text: string;
  isDone: boolean;
  position: string;
  createdAt: string;
}

export interface ChecklistInfo {
  id: string;
  cardId: string;
  title: string;
  position: string;
  items: ChecklistItemInfo[];
}

export interface AttachmentInfo {
  id: string;
  cardId: string;
  name: string;
  url: string;
  size?: number | null;
  mimeType?: string | null;
  createdAt: string;
}

export interface CommentInfo {
  id: string;
  cardId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
}

export interface ActivityInfo {
  id: string;
  boardId: string;
  cardId?: string | null;
  userId: string;
  type: string;
  payload: Record<string, any>;
  createdAt: string;
  user: UserSummary;
}

export interface CardInfo {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  startDate: string | null;
  dueDate: string | null;
  position: string;
  isComplete: boolean;
  coverColor?: string | null;
  createdAt: string;
  updatedAt: string;
  members: UserSummary[];
  labels: LabelInfo[];
  checklists: ChecklistInfo[];
  attachments: AttachmentInfo[];
  commentsCount?: number;
  comments?: CommentInfo[];
  activities?: ActivityInfo[];
}

export interface ListInfo {
  id: string;
  boardId: string;
  title: string;
  emoji: string | null;
  position: string;
  isArchived: boolean;
  createdAt: string;
  cards: CardInfo[];
}

export interface BoardBundle {
  id: string;
  title: string;
  background: string;
  createdAt: string;
  updatedAt: string;
  userRole: Role;
  isStarred: boolean;
  members: BoardMemberInfo[];
  labels: LabelInfo[];
  lists: ListInfo[];
}

export interface BoardSummary {
  id: string;
  title: string;
  background: string;
  createdAt: string;
  updatedAt: string;
  userRole: Role;
  isStarred: boolean;
  members: UserSummary[];
  activeTasksCount: number;
}
