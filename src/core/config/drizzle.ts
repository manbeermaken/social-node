import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/core/schemas/user.schema.js";
import logger from "../utils/logger.js";
import env from './env.js'

const db = drizzle({
  connection: env.POSTGRES_DATABASE_URL,
  casing: "snake_case",
  schema,
});

export async function checkPostgres() {
  try {
    await db.execute("SELECT 1");
    logger.info("Successfully connected to PostgreSQL");
  } catch (error) {
    logger.fatal(
      { error },
      "Failed to connect to PostgreSQL. Exiting process.",
    );
    process.exit(1);
  }
}

export default db;
