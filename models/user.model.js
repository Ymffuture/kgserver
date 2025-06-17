import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // password is required only for non-Google users
      },
    },
    googleId: {
      type: String,
      default: null, // For Google-authenticated users
      index: true,
    },
    photoUrl: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    occupation: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    github: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

