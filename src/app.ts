import express, { type Application } from "express";
import authRoutes from "./routes/authRoutes.js";
import postsRoutes from "./routes/postsRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import requireAuth from "./middlewares/auth.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";
import { pinoHttp } from "pino-http";
import logger from "./utils/logger.js";

const app: Application = express();
app.use(express.json());

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => req.headers["x-request-id"] || crypto.randomUUID(),
    // Keep HTTP logs quiet unless there's an error (optional, good for high-traffic)
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/posts", requireAuth, postsRoutes);

app.use("/api/v1/users", requireAuth, usersRoutes);

app.use(notFound);
app.use(errorHandler);

export default app