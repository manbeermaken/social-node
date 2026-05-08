import type { RequestHandler } from "express";
import redisClient from "@/core/config/redis.js";
import generateTokens from "@/core/utils/generateTokens.js";
import { users } from "@/core/schemas/user.schema.js";
import { userValidationSchema } from "@/core/validations/user.validation.js";
import HttpError from "@/core/utils/httpError.js";
import * as z from "zod";
import db from "@/core/config/drizzle.js";
import { eq } from "drizzle-orm";
import paginationSchema from "@/core/validations/pagination.validation.js";
import type mongoose from "mongoose";
import Post, { type IPost } from "@/core/models/post.model.js";

export const changeUsername: RequestHandler = async (req, res) => {
  const { username, userId } = req;
  const newUsernameValidation = userValidationSchema
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

export const getUserPosts: RequestHandler = async (req, res) => {
  const usernameValidation = userValidationSchema
    .pick({ username: true })
    .safeParse(req.params);
  if (!usernameValidation.success) {
    const errors = z.flattenError(usernameValidation.error).fieldErrors;
    throw new HttpError(422, "Validation Failed", errors);
  }
  const username = usernameValidation.data.username;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const queryValidation = paginationSchema.safeParse(req.query);
  if (!queryValidation.success) {
    const errors = z.flattenError(queryValidation.error).fieldErrors;
    throw new HttpError(422, "Validation Failed", errors);
  }
  const { limit, cursor } = queryValidation.data;

  let query: mongoose.QueryFilter<IPost> = {
    authorId: user.id,
  };
  if (cursor) {
    query._id = { $lt: cursor };
  }

  const posts = await Post.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasNextPage = posts.length > limit;
  const results = hasNextPage ? posts.slice(0, -1) : posts;

  const nextCursor = hasNextPage ? results[results.length - 1]._id : null;

  res.status(200).json({
    posts: results,
    nextCursor,
  });
};
