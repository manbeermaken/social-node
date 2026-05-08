import db from "@/core/config/drizzle.js";
import { eq } from "drizzle-orm";
import HttpError from "@/core/utils/httpError.js";
import { users } from "@/core/schemas/user.schema.js";
import bcrypt from "bcrypt";
import generateTokens from "@/core/utils/generateTokens.js";
import redisClient from "@/core/config/redis.js";

export const authenticateUser = async (
  username: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, "Invalid username or password");
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.username);
  const SEVEN_DAYS = 60 * 60 * 24 * 7;
  await redisClient.setEx(refreshToken, SEVEN_DAYS, user.id);

  return { accessToken, refreshToken };
};
