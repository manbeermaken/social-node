import Post, { type IPost } from "@/core/models/post.model.js";
import type { RequestHandler } from "express";
import db from "@/core/config/drizzle.js";
import { users } from "@/core/schemas/user.schema.js";
import * as z from "zod";
import HttpError from "@/core/utils/httpError.js";
import mongoose from "mongoose";
import { createPostSchema } from "@/core/validations/post.validation.js";
import { eq } from "drizzle-orm";
import env from "@/core/config/env.js";

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.isValidObjectId(val), {
    message: "Invalid cursor format",
  });

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: objectIdSchema.optional(),
});

export const getPostFromId: RequestHandler = async (req, res, next) => {
  const postId = req.params.id;

  if (!mongoose.isValidObjectId(postId)) {
    throw new HttpError(422, "Invalid post id");
  }

  const post = await Post.findById(postId);
  if (post === null) {
    throw new HttpError(404, "Post not found");
  }

  req.post = post;
  next();
};

export const getPosts: RequestHandler = async (req, res) => {
  const queryValidation = paginationSchema.safeParse(req.query);
  if (!queryValidation.success) {
    const errors = z.flattenError(queryValidation.error).fieldErrors;
    throw new HttpError(422, "Validation Failed", errors);
  }

  const { limit, cursor } = queryValidation.data;

  let query: mongoose.QueryFilter<IPost> = {};
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

export const getPost: RequestHandler = async (req, res) => {
  res.status(200).json(req.post);
};

export const createPost: RequestHandler = async (req, res) => {
  const postValidation = createPostSchema
    .pick({ title: true, content: true })
    .safeParse(req.body);
  if (!postValidation.success) {
    const errors = z.flattenError(postValidation.error).fieldErrors;
    throw new HttpError(422, "Validation failed", errors);
  }
  const { title, content } = postValidation.data;

  const userId = req.userId;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId!))
    .limit(1);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const modRes = await fetch(`${env.FASTAPI_URL}/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!modRes.ok) {
    throw new HttpError(502, "Moderation service unavailable");
  }
  const data = await modRes.json();
  if (data.is_flagged) {
    throw new HttpError(422, "Moderation Failed");
  }

  const post = new Post({
    title: title,
    content: content,
    authorId: user.id,
    authorName: user.username,
  });

  const newPost = await post.save();
  res.status(201).json(newPost);
};

export const updatePost: RequestHandler = async (req, res) => {
  const postValidation = createPostSchema
    .pick({ content: true })
    .safeParse(req.body);
  if (!postValidation.success) {
    const errors = z.flattenError(postValidation.error).fieldErrors;
    throw new HttpError(422, "Validation failed", errors);
  }
  const { content } = postValidation.data;

  if (!req.post) {
    throw new HttpError(401, "Post not found");
  }
  const title = req.post.title;

  if (req.post.authorId.toString() !== req.userId!.toString()) {
    throw new HttpError(403, "Not allowed");
  }

  const modRes = await fetch(`${env.FASTAPI_URL}/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!modRes.ok) {
    throw new HttpError(502, "Moderation service unavailable");
  }
  const data = await modRes.json();
  if (data.is_flagged) {
    throw new HttpError(422, "Moderation Failed");
  }

  req.post.content = content;
  const updatedPost = await req.post.save();
  res.json(updatedPost);
};

export const deletePost: RequestHandler = async (req, res) => {
  if (!req.post) {
    throw new HttpError(404, "Post not found");
  }

  if (req.post.authorId.toString() !== req.userId!.toString()) {
    throw new HttpError(403, "Not allowed");
  }

  await req.post.deleteOne();
  res.status(204).send();
};
