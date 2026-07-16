import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      default: "website", // where they subscribed from, useful for later analytics
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
