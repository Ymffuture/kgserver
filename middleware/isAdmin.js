import { User } from "../models/user.model.js";

// Matches the admin email already hardcoded on the frontend (BlogCard.jsx).
// Having this fallback means admin routes work immediately, even before
// you've manually set role: "admin" on your account in the database.
const FALLBACK_ADMIN_EMAIL = "futurekgomotso@gmail.com";

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.id).select("role email");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const isAuthorized = user.role === "admin" || user.email === FALLBACK_ADMIN_EMAIL;
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("isAdmin middleware error:", error);
    return res.status(500).json({ success: false, message: "Authorization check failed" });
  }
};
