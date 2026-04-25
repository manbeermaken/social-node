import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema.js";
import logger from "../utils/logger.js";

const db = drizzle({
  connection: process.env.POSTGRES_DATABASE_URL,
  casing: "snake_case",
  schema 
});

export async function checkPostgres() {
  try {
    await db.execute('SELECT 1');
    logger.info("Successfully connected to PostgreSQL");
  } catch (error) {
    logger.fatal({ error }, "Failed to connect to PostgreSQL. Exiting process.");
    process.exit(1); 
  }
}

export default db