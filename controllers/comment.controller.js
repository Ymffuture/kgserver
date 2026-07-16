import { Blog } from "../models/blog.model.js";
import Comment from "../models/comment.model.js";

// ✅ Create Comment
export const createComment = async (req, res) => {
  try {
    const { content, parentId, mentions } = req.body;
    const postId = req.params.id;
    const userId = req.id;

    if (!content) return res.status(400).json({ message: 'Text is required', success: false });

    const blog = await Blog.findById(postId);
    if (!blog) return res.status(404).json({ message: "Blog not found", success: false });

    // mentions comes from the frontend's @mention picker as an array of
    // userIds (reliable), not parsed from raw text (which is ambiguous
    // when names collide). Just validate they look like real ObjectIds.
    const validMentions = Array.isArray(mentions)
      ? mentions.filter(id => typeof id === "string" && /^[a-f\d]{24}$/i.test(id))
      : [];

    const comment = await Comment.create({
      content,
      userId,
      postId,
      parentId: parentId || null,
      mentions: validMentions
    });

    await comment.populate({ path: 'userId', select: 'firstName lastName photoUrl' });
    await comment.populate({ path: 'mentions', select: 'firstName lastName' });

    blog.comments.push(comment._id);
    await blog.save();

    req.app.get("io")?.emit("newComment", comment);
    if (validMentions.length) {
      req.app.get("io")?.emit("newMention", { commentId: comment._id, postId, mentions: validMentions });
    }

    return res.status(201).json({ message: 'Comment added successfully', comment, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create comment", error: error.message });
  }
};

// ✅ Get All Comments of a Specific Blog
export const getCommentsOfPost = async (req, res) => {
  try {
    const blogId = req.params.id;
    const comments = await Comment.find({ postId: blogId, isHidden: { $ne: true } })
      .populate("userId", "firstName lastName photoUrl")
      .populate("mentions", "firstName lastName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, comments });
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

    const blog = await Blog.findById(comment.postId).select("author");
    const isCommentOwner = comment.userId.toString() === userId;
    const isBlogOwner = blog && blog.author.toString() === userId;

    if (!isCommentOwner && !isBlogOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
    }

    // Deleting a comment also deletes its replies (parentId === commentId)
    await Comment.deleteMany({ parentId: commentId });
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

    req.app.get("io")?.emit("updateComment", comment);

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
    } else {
      comment.likes.push(userId);
      // Remove dislike
      comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId);
    }

    comment.numberOfLikes = comment.likes.length;
    comment.numberOfDislikes = comment.dislikes.length;

    await comment.save();
    req.app.get("io")?.emit("updateComment", comment);

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

// ✅ Dislike / Undislike Comment
export const dislikeComment = async (req, res) => {
  try {
    const userId = req.id;
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId).populate("userId", "firstName lastName");
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const alreadyDisliked = comment.dislikes.includes(userId);

    if (alreadyDisliked) {
      comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId);
    } else {
      comment.dislikes.push(userId);
      // Remove like
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    }

    comment.numberOfLikes = comment.likes.length;
    comment.numberOfDislikes = comment.dislikes.length;

    await comment.save();
    req.app.get("io")?.emit("updateComment", comment);

    return res.status(200).json({
      success: true,
      message: alreadyDisliked ? "Comment undisliked" : "Comment disliked",
      updatedComment: comment
    });
  } catch (error) {
    console.error("Error disliking comment:", error);
    return res.status(500).json({ success: false, message: "Failed to dislike comment" });
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

export const reactToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.id;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const currentReactors = comment.reactions.get(emoji) || [];
    const alreadyReacted = currentReactors.includes(userId.toString());

    if (alreadyReacted) {
      comment.reactions.set(emoji, currentReactors.filter(uid => uid !== userId.toString()));
    } else {
      comment.reactions.set(emoji, [...currentReactors, userId.toString()]);
    }

    await comment.save();
    res.status(200).json({ success: true, updatedComment: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Report Comment
const AUTO_HIDE_THRESHOLD = 3;

export const reportComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.id;
    const { reason } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const alreadyReported = comment.reports.some(r => r.userId.toString() === userId);
    if (alreadyReported) {
      return res.status(400).json({ success: false, message: "You already reported this comment" });
    }

    comment.reports.push({ userId, reason: reason || "" });
    if (comment.reports.length >= AUTO_HIDE_THRESHOLD) {
      comment.isHidden = true;
    }
    await comment.save();

    return res.status(200).json({
      success: true,
      message: comment.isHidden
        ? "Comment reported and has been hidden pending review"
        : "Comment reported. Thanks for helping keep discussions healthy.",
    });
  } catch (error) {
    console.error("Error reporting comment:", error);
    return res.status(500).json({ success: false, message: "Failed to report comment" });
  }
};
