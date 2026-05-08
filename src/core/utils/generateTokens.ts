import jwt from "jsonwebtoken";
import env from '@/core/config/env.js'

const generateTokens = (
  userId: string,
  username: string,
): {accessToken:string;refreshToken:string} => {
  const accessToken = jwt.sign(
    { id: userId, username },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { id: userId, username },
    env.REFRESH_TOKEN_SECRET,
  );
  return {accessToken, refreshToken};
};

export default generateTokens