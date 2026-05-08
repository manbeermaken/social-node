import env from "../config/env.js";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { RequestHandler } from "express";
import HttpError from "../utils/httpError.js";

interface CustomJwtPayload extends JwtPayload {
  id: string;
  username: string;
}

const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader =
    req.headers.authorization ||
    (req.headers.Authorization as string | undefined);

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Unauthorized: No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      env.ACCESS_TOKEN_SECRET,
    ) as CustomJwtPayload;
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  } catch (err: any) {
    throw new HttpError(403, "Invalid or Expired token");
  }
};

export default requireAuth;
