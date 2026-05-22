import app from "./app";
import { env } from "../config/env";
import { startBackgroundJobs } from "../jobs/job-runner";
import { prisma } from "../shared/db/prisma";
import { logger } from "../shared/logger/logger";

const server = app.listen(env.PORT, () => {
  logger.info({
    message: `API running on http://localhost:${env.PORT}`,
    service: env.SERVICE_NAME
  });

  startBackgroundJobs();
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
