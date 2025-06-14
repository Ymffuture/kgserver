import { Blog } from "../models/blog.model.js";
import Comment from "../models/comment.model.js";

// ✅ Create Comment
export const createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.id;
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Text is required', success: false });

    const blog = await Blog.findById(postId);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    const comment = await Comment.create({
      content,
      userId,
      postId
    });

    await comment.populate("userId", "firstName lastName photoUrl");

    blog.comments.push(comment._id);
    await blog.save();

    return res.status(201).json({
      message: 'Comment added successfully',
      comment,
      success: true
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({ success: false, message: "Failed to create comment" });
  }
};

// ✅ Get All Comments of a Specific Blog
export const getCommentsOfPost = async (req, res) => {
  try {
    const blogId = req.params.id;
    const comments = await Comment.find({ postId: blogId })
      .populate("userId", "firstName lastName photoUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    console.error("Error getting blog comments:", error);
    return res.status(500).json({ success: false, message: "Failed to get comments" });
  }
};

// ✅ Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(commentId);
    await Blog.findByIdAndUpdate(comment.postId, { $pull: { comments: commentId } });

    return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
};

// ✅ Edit Comment
export const editComment = async (req, res) => {
  try {
    const userId = req.id;
    const commentId = req.params.id;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this comment' });
    }

    comment.content = content;
    comment.editedAt = new Date();
    await comment.save();

    return res.status(200).json({ success: true, message: 'Comment updated successfully', comment });
  } catch (error) {
    console.error("Error editing comment:", error);
    return res.status(500).json({ success: false, message: "Failed to edit comment" });
  }
};

// ✅ Like / Unlike Comment
export const likeComment = async (req, res) => {
  try {
    const userId = req.id;
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId).populate("userId", "firstName lastName");
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const alreadyLiked = comment.likes.includes(userId);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
      comment.numberOfLikes -= 1;
    } else {
      comment.likes.push(userId);
      comment.numberOfLikes += 1;
    }

    await comment.save();

    return res.status(200).json({
      success: true,
      message: alreadyLiked ? "Comment unliked" : "Comment liked",
      updatedComment: comment
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    return res.status(500).json({ success: false, message: "Failed to like comment" });
  }
};

// ✅ Get All Comments On My Blogs
export const getAllCommentsOnMyBlogs = async (req, res) => {
  try {
    const userId = req.id;

    const myBlogs = await Blog.find({ author: userId }).select("_id");

    if (myBlogs.length === 0) {
      return res.status(200).json({
        success: true,
        totalComments: 0,
        comments: [],
        message: "No blogs found for this user."
      });
    }

    const blogIds = myBlogs.map(blog => blog._id);

    const comments = await Comment.find({ postId: { $in: blogIds } })
      .populate("userId", "firstName lastName email")
      .populate("postId", "title");

    return res.status(200).json({
      success: true,
      totalComments: comments.length,
      comments
    });
  } catch (error) {
    console.error("Error fetching comments on user's blogs:", error);
    return res.status(500).json({ success: false, message: "Failed to get comments." });
  }
};

