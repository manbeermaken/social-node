import redis from "redis";
import logger from "../utils/logger.js";

const redisClient = redis.createClient();

redisClient.on("error", (err) => {
  logger.error({ err }, "Redis Client Error");
});

redisClient.on("connect", () => {
  logger.info("Successfully connected to Redis");
});

redisClient.connect().catch((err) => {
  logger.fatal({ err }, "Failed to connect to Redis. Exiting process.");
  process.exit(1);
});

export default redisClient;
