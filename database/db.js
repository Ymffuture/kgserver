import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "quorvex", // ✅ Use string here
    });

    console.log("✅ MongoDB connected successfully to 'quorvexinstitute'");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};

export default connectDB;

