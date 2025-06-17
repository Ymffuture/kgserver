
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
  content: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  numberOfLikes: { type: Number, default: 0 },
  numberOfDislikes: { type: Number, default: 0 },
  editedAt: { type: Date },
}, { timestamps: true });

);

// Optional: Auto-update like/dislike counters if needed
commentSchema.methods.updateLikesCount = function () {
  this.numberOfLikes = this.likes.length;
  return this.save();
};

commentSchema.methods.updateDislikesCount = function () {
  this.numberOfDislikes = this.dislikes.length;
  return this.save();
};

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
