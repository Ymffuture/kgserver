import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
  },
  description: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
    dislikes: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}],

  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Ensure a user can like a blog only once
blogSchema.index({ _id: 1, 'likes': 1 });

export const Blog = mongoose.model("Blog", blogSchema);

