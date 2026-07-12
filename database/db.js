import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error(
      "\n❌ [FATAL] MONGO_URI is not set. Create a .env file (see .env.example) and set MONGO_URI.\n"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ [FATAL] MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;

