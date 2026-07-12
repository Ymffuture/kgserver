import express from "express"

import { isAuthenticated } from "../middleware/isAuthenticated.js"
import { singleUpload } from "../middleware/multer.js"
import {createBlog, deleteBlog, dislikeBlog, getAllBlogs, getBlogById, getMyTotalBlogLikes, getOwnBlogs, getPublishedBlog, likeBlog, togglePublishBlog, updateBlog, getMyTotalBlogDislikes} from "../controllers/blog.controller.js"

const router = express.Router()

router.route("/").post(isAuthenticated, createBlog)
router.route("/:blogId").put(isAuthenticated, singleUpload, updateBlog)
router.route("/:blogId").patch(togglePublishBlog);

// Static-path GET routes must be registered before the generic "/:blogId"
// GET route below, otherwise Express would match e.g. "get-all-blogs" as a blogId.
router.route("/get-all-blogs").get(getAllBlogs)
router.route("/get-published-blogs").get(getPublishedBlog)
router.route("/get-own-blogs").get(isAuthenticated, getOwnBlogs)
router.route("/delete/:id").delete(isAuthenticated, deleteBlog);

// Frontend sends POST for like/dislike (see BlogView.jsx toggleReaction) —
// these were previously GET, which silently failed as a method mismatch.
router.post("/:id/like", isAuthenticated, likeBlog);
router.post("/:id/dislike", isAuthenticated, dislikeBlog);

router.get('/my-blogs/likes', isAuthenticated, getMyTotalBlogLikes)
router.get('/me/dislikes', isAuthenticated, getMyTotalBlogDislikes);

// Fetch a single blog by id — used when viewing a blog directly (e.g. page
// refresh) and it isn't already in Redux state. Must stay after the
// static-path GET routes above.
router.route("/:blogId").get(getBlogById)

export default router;
