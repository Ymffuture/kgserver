import Comment from "../models/comment.model.js";
import { Blog } from "../models/blog.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";

// ───────────────────────── Comments ─────────────────────────

// GET /api/v1/admin/comments?page=1&limit=20&search=
export const getAllCommentsAdmin = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const search = req.query.search?.trim();

    const filter = {};
    if (search) {
      filter.content = { $regex: search, $options: "i" };
    }

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate("userId", "firstName lastName email photoUrl isBlockedFromCommenting")
        .populate("postId", "title")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Comment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("getAllCommentsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch comments" });
  }
};

// DELETE /api/v1/admin/comments/:id
export const deleteCommentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    await Comment.deleteMany({ parentId: id }); // delete replies too
    await Comment.findByIdAndDelete(id);
    await Blog.findByIdAndUpdate(comment.postId, { $pull: { comments: id } });

    return res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("deleteCommentAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
};

// ───────────────────────── Reports ─────────────────────────

// GET /api/v1/admin/reports — comments that have at least one report,
// worst offenders (most reports) first.
export const getReportedComments = async (req, res) => {
  try {
    const comments = await Comment.find({ "reports.0": { $exists: true } })
      .populate("userId", "firstName lastName email photoUrl isBlockedFromCommenting")
      .populate("postId", "title")
      .populate("reports.userId", "firstName lastName email")
      .sort({ updatedAt: -1 })
      .lean();

    comments.sort((a, b) => (b.reports?.length || 0) - (a.reports?.length || 0));

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("getReportedComments error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reports" });
  }
};

// POST /api/v1/admin/reports/:id/resolve — clear reports & unhide (dismiss as not-actually-bad)
export const resolveReport = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    comment.reports = [];
    comment.isHidden = false;
    await comment.save();

    return res.status(200).json({ success: true, message: "Reports cleared, comment restored" });
  } catch (error) {
    console.error("resolveReport error:", error);
    return res.status(500).json({ success: false, message: "Failed to resolve report" });
  }
};

// POST /api/v1/admin/reports/:id/dismiss — keep hidden but stop it showing in the reports queue is
// not applicable (deleting IS the "keep it gone" action); this endpoint instead removes the comment
// entirely, for reports that were valid.
export const deleteReportedComment = deleteCommentAdmin;

// ───────────────────────── User moderation ─────────────────────────

// POST /api/v1/admin/users/:id/block
export const blockUserFromCommenting = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlockedFromCommenting: true, blockedReason: reason || "" },
      { new: true }
    ).select("firstName lastName email isBlockedFromCommenting blockedReason");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, message: "User blocked from commenting", user });
  } catch (error) {
    console.error("blockUserFromCommenting error:", error);
    return res.status(500).json({ success: false, message: "Failed to block user" });
  }
};

// POST /api/v1/admin/users/:id/unblock
export const unblockUserFromCommenting = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlockedFromCommenting: false, blockedReason: "" },
      { new: true }
    ).select("firstName lastName email isBlockedFromCommenting");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, message: "User unblocked", user });
  } catch (error) {
    console.error("unblockUserFromCommenting error:", error);
    return res.status(500).json({ success: false, message: "Failed to unblock user" });
  }
};

// GET /api/v1/admin/users/blocked
export const getBlockedUsers = async (req, res) => {
  try {
    const users = await User.find({ isBlockedFromCommenting: true })
      .select("firstName lastName email photoUrl blockedReason createdAt");
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("getBlockedUsers error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch blocked users" });
  }
};

// ───────────────────────── Subscriptions ─────────────────────────

// GET /api/v1/admin/subscriptions?page=1&limit=20
export const getSubscriptionsAdmin = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);

    const [subscriptions, total, activeCount] = await Promise.all([
      Subscription.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Subscription.countDocuments(),
      Subscription.countDocuments({ active: true }),
    ]);

    return res.status(200).json({
      success: true,
      subscriptions,
      total,
      activeCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("getSubscriptionsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch subscriptions" });
  }
};

// DELETE /api/v1/admin/subscriptions/:id
export const deleteSubscriptionAdmin = async (req, res) => {
  try {
    const deleted = await Subscription.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Subscription not found" });
    return res.status(200).json({ success: true, message: "Subscription removed" });
  } catch (error) {
    console.error("deleteSubscriptionAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove subscription" });
  }
};

// ───────────────────────── Dashboard summary ─────────────────────────

// GET /api/v1/admin/stats
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalComments,
      reportedComments,
      hiddenComments,
      blockedUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalBlogs,
      totalUsers,
    ] = await Promise.all([
      Comment.countDocuments(),
      Comment.countDocuments({ "reports.0": { $exists: true } }),
      Comment.countDocuments({ isHidden: true }),
      User.countDocuments({ isBlockedFromCommenting: true }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ active: true }),
      Blog.countDocuments(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalComments,
        reportedComments,
        hiddenComments,
        blockedUsers,
        totalSubscriptions,
        activeSubscriptions,
        totalBlogs,
        totalUsers,
      },
    });
  } catch (error) {
    console.error("getAdminStats error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};
