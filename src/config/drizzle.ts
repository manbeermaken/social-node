import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema.js";

const db = drizzle({
  connection: process.env.POSTGRES_DATABASE_URL,
  casing: "snake_case",
  schema 
});

export default db