import express from 'express';
import {
  createComment,
  getComments,
  getReplies,
  updateComment,
  deleteComment,
  voteComment
} from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Comment routes
router.post('/', authenticate, createComment);
router.get('/blog/:blogId', getComments);
router.get('/:commentId/replies', getReplies);
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);
router.post('/:id/vote', authenticate, voteComment);

export default router;