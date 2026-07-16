import { Subscription } from "../models/subscription.model.js";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// POST /api/v1/subscription/subscribe
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "A valid email is required" });
    }

    const existing = await Subscription.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.active) {
        return res.status(400).json({ success: false, message: "You're already subscribed!" });
      }
      existing.active = true;
      await existing.save();
      return res.status(200).json({ success: true, message: "Welcome back! You're re-subscribed." });
    }

    await Subscription.create({ email: email.toLowerCase() });
    return res.status(201).json({ success: true, message: "Subscribed! Thanks for joining." });
  } catch (error) {
    console.error("subscribe error:", error);
    return res.status(500).json({ success: false, message: "Failed to subscribe" });
  }
};

// POST /api/v1/subscription/unsubscribe
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const sub = await Subscription.findOneAndUpdate(
      { email: email.toLowerCase() },
      { active: false }
    );
    if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });

    return res.status(200).json({ success: true, message: "You've been unsubscribed." });
  } catch (error) {
    console.error("unsubscribe error:", error);
    return res.status(500).json({ success: false, message: "Failed to unsubscribe" });
  }
};
