import express from 'express';
import {
  createBlog,
  getBlogs,
  getBlogByIdOrSlug,
  updateBlog,
  deleteBlog,
  toggleLike,
  getUserBlogs
} from '../controllers/blog.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Blog routes
router.post('/', authenticate, createBlog);
router.get('/', getBlogs);
router.get('/:idOrSlug', getBlogByIdOrSlug);
router.put('/:id', authenticate, updateBlog);
router.delete('/:id', authenticate, deleteBlog);
router.post('/:id/like', authenticate, toggleLike);
router.get('/user/:userId', getUserBlogs);

export default router;