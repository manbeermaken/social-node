import app from "./app.js";
import env from "./core/config/env.js";
import connectDB from "./core/config/mongodb.js";
import { checkPostgres } from "@/core/config/drizzle.js";
import logger from "./core/utils/logger.js";

async function startServer() {
  await connectDB();
  await checkPostgres();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

startServer().catch((error) => {
  logger.fatal("Failed to start server", error);
  process.exit(1);
});
