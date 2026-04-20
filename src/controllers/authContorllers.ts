import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import redisClient from "../config/redis.js";
import bcrypt from "bcrypt";
import type { RequestHandler } from "express";
import db from "../config/drizzle.js";
import { eq } from "drizzle-orm";
import { users, userInsertSchema } from "../db/schema.js";
import HttpError from "../utils/httpError.js";
import * as z from "zod";
import env from "../config/env.js";

interface CustomJwtPayload extends JwtPayload {
  id: string;
  username: string;
}

export const generateTokens = (
  userId: string,
  username: string,
): [string, string] => {
  const accessToken = jwt.sign(
    { id: userId, username },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { id: userId, username },
    env.REFRESH_TOKEN_SECRET,
  );
  return [accessToken, refreshToken];
};

export const login: RequestHandler = async (req, res) => {
  const userValidation = userInsertSchema.safeParse(req.body);
  if (!userValidation.success) {
    const errors = z.flattenError(userValidation.error).fieldErrors;
    throw new HttpError(422, "Validation failed", errors);
  }

  const userData = userValidation.data;

  const user = await db.query.users.findFirst({
    where: eq(users.username, userData.username),
  });

  if (!user || !(await bcrypt.compare(userData.password, user.password))) {
    throw new HttpError(401, "Invalid username or password");
  }

  const [accessToken, refreshToken] = generateTokens(user.id, user.username);
  const SEVEN_DAYS = 60 * 60 * 24 * 7;
  await redisClient.setEx(refreshToken, SEVEN_DAYS, user.id);
  res.json({ success: true, accessToken, refreshToken });
};

export const refreshToken: RequestHandler = async (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (refreshToken == null) {
    throw new HttpError(401, "Token not provided");
  }

  const tokenExists = await redisClient.get(refreshToken);
  if (!tokenExists) {
    throw new HttpError(403, "Invalid or expired token");
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      env.REFRESH_TOKEN_SECRET,
    ) as CustomJwtPayload;

    const accessToken = jwt.sign(
      { id: decoded.id, username: decoded.username },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    res.json({ success: true, accessToken });
  } catch (err) {
    throw new HttpError(403, "Invalid or expired token");
  }
};

export const signup: RequestHandler = async (req, res) => {
  const userValidation = userInsertSchema.safeParse(req.body);
  if (!userValidation.success) {
    const errors = z.flattenError(userValidation.error).fieldErrors;
    throw new HttpError(422, "Validation failed", errors);
  }

  const userData = userValidation.data;
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const newUser = await db
      .insert(users)
      .values({ username: userData.username, password: hashedPassword })
      .returning();

    const [accessToken, refreshToken] = generateTokens(
      newUser[0].id,
      newUser[0].username,
    );
    const SEVEN_DAYS = 60 * 60 * 24 * 7;
    await redisClient.setEx(refreshToken, SEVEN_DAYS, newUser[0].id);
    res.status(201).json({ success: true, accessToken, refreshToken });
  } catch (err: any) {
    if (err.cause.code === "23505") {
      throw new HttpError(400, "Username already exists");
    }
    throw err;
  }
};

export const logout: RequestHandler = async (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (refreshToken == null) {
    throw new HttpError(401, "Token not provided");
  }

  await redisClient.del(refreshToken);
  res.status(204).send();
};
