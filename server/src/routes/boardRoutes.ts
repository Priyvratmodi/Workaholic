import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireBoardPermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createBoardSchema, updateBoardSchema } from '@workaholic/shared';
import {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  starBoard,
  unstarBoard,
  getBoardActivity,
} from '../controllers/boardController.js';

const router = Router();

// List all boards for the authenticated user
router.get('/', requireAuth, getBoards);

// Create a new board (from template or blank)
router.post('/', requireAuth, validate(createBoardSchema), createBoard);

// Get a board bundle with all lists, cards, members, labels
router.get('/:id', requireAuth, requireBoardPermission('view'), getBoardById);

// Update board title or background (requires edit permission)
router.patch('/:id', requireAuth, requireBoardPermission('edit'), validate(updateBoardSchema), updateBoard);

// Delete board (requires deleteBoard permission: owner only)
router.delete('/:id', requireAuth, requireBoardPermission('deleteBoard'), deleteBoard);

// Star/unstar board
router.post('/:id/star', requireAuth, requireBoardPermission('view'), starBoard);
router.delete('/:id/star', requireAuth, requireBoardPermission('view'), unstarBoard);

// Get board activity feed
router.get('/:id/activity', requireAuth, requireBoardPermission('view'), getBoardActivity);

export default router;
