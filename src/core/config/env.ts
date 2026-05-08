import { z } from "zod";
import logger from "../utils/logger.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "prod"]).default("dev"),
  LOG_LEVEL: z.enum(["INFO", "WARN", "ERROR"]).default("INFO"),
  PORT: z.coerce.number().default(8000),
  MONGODB_DATABASE_URL: z.url().default("mongodb://127.0.0.1:27017/social"),
  POSTGRES_DATABASE_URL: z.url(),
  ACCESS_TOKEN_SECRET: z.string().min(1).default("access_token_secret"),
  REFRESH_TOKEN_SECRET: z.string().min(1).default("refresh_token_secret"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  FASTAPI_URL: z.url().default("http://localhost:8001"),
  RESEND_API_KEY: z.string().optional(),
});

const envValidation = envSchema.safeParse(process.env);

if (!envValidation.success) {
  logger.fatal("Invalid or missing enviroment Variables");
  logger.error(z.prettifyError(envValidation.error));
  process.exit(1);
}

const env = envValidation.data!;

export default env;
