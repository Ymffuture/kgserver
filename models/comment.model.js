import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: {
      type: Map,
      of: [mongoose.Schema.Types.ObjectId], // e.g., { 😂: [user1, user2] }
      default: {}
    },
    numberOfLikes: { type: Number, default: 0 },
    numberOfDislikes: { type: Number, default: 0 },
    editedAt: { type: Date },
    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    isHidden: { type: Boolean, default: false },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
