import type { RequestHandler } from "express";
import redisClient from "../config/redis.js";
import { generateTokens } from "./authContorllers.js";
import { userInsertSchema, users } from "../db/schema.js";
import HttpError from "../utils/httpError.js";
import * as z from "zod";
import db from "../config/drizzle.js";
import { eq } from "drizzle-orm";

export const changeUsername: RequestHandler = async (req, res) => {
  const { username, userId } = req;
  const newUsernameValidation = userInsertSchema
    .pick({ username: true })
    .safeParse(req.body);
  if (!newUsernameValidation.success) {
    const errors = z.flattenError(newUsernameValidation.error).fieldErrors;
    throw new HttpError(422, "Validation failed", errors);
  }
  const newUsername = newUsernameValidation.data.username;

  if (username === newUsername) {
    throw new HttpError(
      400,
      "New username must be different from the current one",
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId!),
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  try {
    const newUser = await db
      .update(users)
      .set({ username: newUsername })
      .where(eq(users.id, userId!))
      .returning();

    const xAddResult = await redisClient.xAdd("changeUsername", "*", {
      userId: user.id,
      newUsername: newUsername,
    });

    const [accessToken, refreshToken] = generateTokens(
      newUser[0].id,
      newUser[0].username,
    );
    res.status(200).json({ accessToken, refreshToken });
  } catch (err: any) {
    if (err.cause.code === "23505") {
      throw new HttpError(400, "Username already exists");
    }
    throw err;
  }
};

export const changePassword: RequestHandler = async (req, res) => {};
