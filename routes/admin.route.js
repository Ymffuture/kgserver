import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";
import {
  getAllCommentsAdmin,
  deleteCommentAdmin,
  getReportedComments,
  resolveReport,
  blockUserFromCommenting,
  unblockUserFromCommenting,
  getBlockedUsers,
  getSubscriptionsAdmin,
  deleteSubscriptionAdmin,
  getAdminStats,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(isAuthenticated, isAdmin);

router.get("/stats", getAdminStats);

router.get("/comments", getAllCommentsAdmin);
router.delete("/comments/:id", deleteCommentAdmin);

router.get("/reports", getReportedComments);
router.post("/reports/:id/resolve", resolveReport);
router.delete("/reports/:id", deleteCommentAdmin);

router.get("/users/blocked", getBlockedUsers);
router.post("/users/:id/block", blockUserFromCommenting);
router.post("/users/:id/unblock", unblockUserFromCommenting);

router.get("/subscriptions", getSubscriptionsAdmin);
router.delete("/subscriptions/:id", deleteSubscriptionAdmin);

export default router;
