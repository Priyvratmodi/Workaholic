import { z } from 'zod';
import { PASTEL_BACKGROUND_KEYS, mapLegacyBackgroundToPastel } from './boardBackgrounds.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createBoardSchema = z.object({
  title: z.string().min(1, 'Board title is required').max(100),
  templateId: z.string().optional(),
  background: z.string().optional().transform((val) => (val ? mapLegacyBackgroundToPastel(val) : 'sky')),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  background: z.string().optional().transform((val) => (val ? mapLegacyBackgroundToPastel(val) : undefined)),
});

export const createListSchema = z.object({
  title: z.string().min(1, 'List title is required').max(100),
  emoji: z.string().max(8).optional().nullable(),
  color: z.string().optional().nullable(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  emoji: z.string().max(8).optional().nullable(),
  color: z.string().optional().nullable(),
  position: z.string().optional(),
  isArchived: z.boolean().optional(),
});


export const createCardSchema = z.object({
  title: z.string().min(1, 'Card title is required').max(300),
  description: z.string().optional().nullable(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional().nullable(),
  listId: z.string().optional(),
  position: z.string().optional(),
  isComplete: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  coverColor: z.string().optional().nullable(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty'),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty'),
});

export const createChecklistSchema = z.object({
  title: z.string().min(1).max(100).default('Checklist'),
});

export const createChecklistItemSchema = z.object({
  text: z.string().min(1, 'Item text is required').max(300),
});

export const updateChecklistItemSchema = z.object({
  text: z.string().min(1).max(300).optional(),
  isDone: z.boolean().optional(),
  position: z.string().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'viewer']),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'member', 'viewer']),
});

export const createLabelSchema = z.object({
  name: z.string().max(50).optional().nullable(),
  color: z.string().min(1),
});

export const assignMemberSchema = z.object({
  userId: z.string(),
});

export const assignLabelSchema = z.object({
  labelId: z.string(),
});

export const createAttachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  size: z.number().optional().nullable(),
  mimeType: z.string().optional().nullable(),
});

export const updatePreferencesSchema = z.object({
  themePreference: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
  reduceMotion: z.boolean().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

