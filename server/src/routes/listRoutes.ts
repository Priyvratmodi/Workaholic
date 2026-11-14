import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireBoardPermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { updateListSchema, createCardSchema } from '@workaholic/shared';
import { updateList, deleteList } from '../controllers/listController.js';
import { createCard } from '../controllers/cardController.js';

const router = Router();

// Update a list (rename, archive, reorder)
router.patch('/:id', requireAuth, requireBoardPermission('edit'), validate(updateListSchema), updateList);

// Delete a list
router.delete('/:id', requireAuth, requireBoardPermission('edit'), deleteList);

// Create a card in this list
router.post('/:listId/cards', requireAuth, requireBoardPermission('edit'), validate(createCardSchema), createCard);

export default router;
