import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: 1,
      maxlength: 1000
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment', // Support for nested replies
      default: null
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    numberOfLikes: {
      type: Number,
      default: 0
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Optional: Auto-update `numberOfLikes` on like/unlike
commentSchema.methods.updateLikesCount = function () {
  this.numberOfLikes = this.likes.length;
  return this.save();
};

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;

