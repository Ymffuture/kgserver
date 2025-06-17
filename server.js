import express from "express";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import userRoute from "./routes/user.route.js";
import blogRoute from "./routes/blog.route.js";
import commentRoute from "./routes/comment.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http"; // 👈 Needed for socket.io
import { Server as SocketServer } from "socket.io"; // 👈 Socket.io

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS
const corsOptions = {
  origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/blog", blogRoute);
app.use("/api/v1/comment", commentRoute);

// Serve frontend (production)
app.use(express.static(path.join(__dirname, "/frontend/dist")));
app.get("*", (_, res) => {
  res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
});

// Create HTTP server & socket.io server
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: corsOptions,
});

// Store io globally for controllers
app.set("io", io);

// Socket listeners (optional)
io.on("connection", (socket) => {
  console.log("🟢 New client connected");

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected");
  });

  // Listen for client-side emit, then rebroadcast
  socket.on("updateReaction", (blogId) => {
    console.log(`Reaction updated for blog: ${blogId}`);
    // The actual emit is done in controller after DB update
  });

  socket.on("newComment", (data) => {
    console.log("New comment received:", data);
    io.emit("commentUpdate", data);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  connectDB();
});

