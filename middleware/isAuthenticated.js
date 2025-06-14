import jwt from "jsonwebtoken";

export const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.id = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

