import express, { type Application } from "express";
import authRoutes from "@/modules/auth/auth.routes.js";
import postsRoutes from "@/modules/posts/posts.routes.js";
import usersRoutes from "@/modules/users/users.routes.js";
import requireAuth from "@/core/middlewares/auth.js";
import errorHandler from "@/core/middlewares/errorHandler.js";
import notFound from "@/core/middlewares/notFound.js";
import { pinoHttp } from "pino-http";
import logger from "@/core/utils/logger.js";

const app: Application = express();

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => req.headers["x-request-id"] || crypto.randomUUID(),
    // keep http logs quiet unless there is an error
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);

app.use(express.json());

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/posts", requireAuth, postsRoutes);

app.use("/api/v1/users", requireAuth, usersRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
