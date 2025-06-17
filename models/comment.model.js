import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    parentId: {
      type: Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likes: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    numberOfLikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    numberOfDislikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model("Comment", commentSchema);

