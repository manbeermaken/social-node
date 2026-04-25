import env from "./env.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js"; // Adjust path to your logger

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_DATABASE_URL);

    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to MongoDB. Exiting process.");
    process.exit(1);
  }
};

export default connectDB;
