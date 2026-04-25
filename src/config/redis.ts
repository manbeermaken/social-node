import redis from "redis";
import logger from "../utils/logger.js"; // Adjust path to your logger

const redisClient = redis.createClient();

redisClient.on("error", (err) => {
  logger.error({ err }, "Redis Client Error");
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

redisClient.connect().catch((err) => {
  logger.error({ err }, "Failed to connect to Redis on startup");
});

export default redisClient;
