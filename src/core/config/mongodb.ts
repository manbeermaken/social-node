import env from "./env.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_DATABASE_URL);

    logger.info("Successfully connected to MongoDB");
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to MongoDB. Exiting process.");
    process.exit(1);
  }
};

export async function disconnectDB() {
  await mongoose.connection.close();
}

export default connectDB;
