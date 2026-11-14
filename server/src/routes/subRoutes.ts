import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireBoardPermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from '@workaholic/shared';
import {
  deleteChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  deleteComment,
  deleteAttachment,
} from '../controllers/cardDetailController.js';

const router = Router();

// Delete a checklist
router.delete(
  '/checklists/:id',
  requireAuth,
  requireBoardPermission('edit'),
  deleteChecklist
);

// Add item to checklist
router.post(
  '/checklists/:checklistId/items',
  requireAuth,
  requireBoardPermission('edit'),
  validate(createChecklistItemSchema),
  addChecklistItem
);

// Update checklist item
router.patch(
  '/checklist-items/:id',
  requireAuth,
  requireBoardPermission('edit'),
  validate(updateChecklistItemSchema),
  updateChecklistItem
);

// Delete checklist item
router.delete(
  '/checklist-items/:id',
  requireAuth,
  requireBoardPermission('edit'),
  deleteChecklistItem
);

// Delete comment
router.delete(
  '/comments/:id',
  requireAuth,
  requireBoardPermission('comment'),
  deleteComment
);

// Delete attachment
router.delete(
  '/attachments/:id',
  requireAuth,
  requireBoardPermission('edit'),
  deleteAttachment
);

export default router;
