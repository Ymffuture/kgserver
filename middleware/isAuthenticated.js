import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"; // Adjust path as needed

export const isAuthenticated = async (req, res, next) => {
  try {
    // Accept token from cookie or Authorization Bearer header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication token missing" });
    }

    // Verify token and get decoded payload
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Fetch user from database (for both Google and Email users)
    const user = await User.findById(decoded.userId || decoded.id); // support different keys

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user; // attach full user object to request
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

