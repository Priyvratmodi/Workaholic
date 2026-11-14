import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireBoardPermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  updateCardSchema,
  createChecklistSchema,
  createCommentSchema,
  assignMemberSchema,
  assignLabelSchema,
  createAttachmentSchema,
} from '@workaholic/shared';
import { updateCard, deleteCard } from '../controllers/cardController.js';
import {
  getCardDetails,
  createChecklist,
  addComment,
  assignMember,
  unassignMember,
  assignLabel,
  unassignLabel,
  addAttachment,
} from '../controllers/cardDetailController.js';

const router = Router();

// Get card details (including checklists, comments, activities)
router.get('/:id', requireAuth, requireBoardPermission('view'), getCardDetails);

// Update a card
router.patch('/:id', requireAuth, requireBoardPermission('edit'), validate(updateCardSchema), updateCard);

// Delete a card
router.delete('/:id', requireAuth, requireBoardPermission('edit'), deleteCard);

// Checklist routes on card
router.post(
  '/:cardId/checklists',
  requireAuth,
  requireBoardPermission('edit'),
  validate(createChecklistSchema),
  createChecklist
);

// Comments routes on card
router.post(
  '/:cardId/comments',
  requireAuth,
  requireBoardPermission('comment'),
  validate(createCommentSchema),
  addComment
);

// Member assignment routes on card
router.post(
  '/:cardId/members',
  requireAuth,
  requireBoardPermission('edit'),
  validate(assignMemberSchema),
  assignMember
);
router.delete('/:cardId/members/:userId', requireAuth, requireBoardPermission('edit'), unassignMember);

// Label assignment routes on card
router.post(
  '/:cardId/labels',
  requireAuth,
  requireBoardPermission('edit'),
  validate(assignLabelSchema),
  assignLabel
);
router.delete('/:cardId/labels/:labelId', requireAuth, requireBoardPermission('edit'), unassignLabel);

// Attachment routes on card
router.post(
  '/:cardId/attachments',
  requireAuth,
  requireBoardPermission('edit'),
  validate(createAttachmentSchema),
  addAttachment
);

export default router;
