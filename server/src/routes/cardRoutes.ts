import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireBoardPermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { updateCardSchema } from '@workaholic/shared';
import { updateCard, deleteCard } from '../controllers/cardController.js';

const router = Router();

// Update a card (including move, reorder, text, due dates, complete)
router.patch('/:id', requireAuth, requireBoardPermission('edit'), validate(updateCardSchema), updateCard);

// Delete a card
router.delete('/:id', requireAuth, requireBoardPermission('edit'), deleteCard);

export default router;
