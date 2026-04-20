import {
  uuid,
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const roleEnum = pgEnum("Role", ["USER", "ADMIN"]);

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),

    username: text().notNull().unique(),

    password: text().notNull(),

    role: roleEnum().default("USER").notNull(),

    createdAt: timestamp({ precision: 3 }).defaultNow().notNull(),

    updatedAt: timestamp({ precision: 3 })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("users_username_idx").on(table.username)],
);

export const userInsertSchema = createInsertSchema(users,{
  username:(schema)=>schema.min(3,"Username must be atleast 3 characters long"),
  password:(schema)=>schema.min(6,"Password must be atleast 6 characters long")
})