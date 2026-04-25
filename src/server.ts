import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/mongodb.js";
import { checkPostgres } from "./config/drizzle.js";
import logger from "./utils/logger.js";

async function startServer() {
  await connectDB();
  await checkPostgres();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
