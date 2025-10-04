import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        message: "Note: you are not authenticated",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (!decoded?.userId) {
      return res.status(401).json({
        message: "Invalid token payload",
        success: false,
      });
    }

    req.id = decoded.userId;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({
      message: "Session expired or invalid token",
      success: false,
    });
  }
};

