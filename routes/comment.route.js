import express from "express";

import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  createComment,
  deleteComment,
  editComment,
  getAllCommentsOnMyBlogs,
  getCommentsOfPost,
  likeComment,
  dislikeComment // ✅ NEW controller
} from "../controllers/comment.controller.js";

const router = express.Router();

// Create, edit, delete comments
router.post('/:id/create', isAuthenticated, createComment);
router.put('/:id/edit', isAuthenticated, editComment);
router.delete('/:id/delete', isAuthenticated, deleteComment);

// Get comments
router.get('/:id/comment/all', getCommentsOfPost);
router.get('/my-blogs/comments', isAuthenticated, getAllCommentsOnMyBlogs);

// Like / Dislike
router.get('/:id/like', isAuthenticated, likeComment);
router.get('/:id/dislike', isAuthenticated, dislikeComment); // ✅ NEW route

export default router;

