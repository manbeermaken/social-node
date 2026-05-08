import {
  uuid,
  pgTable,
  timestamp,
  pgEnum,
  varchar,
  unique,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["USER", "ADMIN"]);

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),

    username: varchar({ length: 255 }).notNull(),

    password: varchar({ length: 255 }).notNull(),

    role: roleEnum().default("USER").notNull(),

    createdAt: timestamp({ precision: 6, withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp({ precision: 6, withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique("users_username_unique").on(table.username)],
);