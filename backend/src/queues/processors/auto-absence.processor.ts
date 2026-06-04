// @ts-nocheck
// TODO: Remove after installing bull + ioredis
import { Job } from "bull";
import { autoAbsenceQueue } from "../queue";
import { runAutoAbsenceJob } from "../../jobs/auto-absence.job";
import { logger } from "../../shared/logger/logger";

autoAbsenceQueue.process(async (_job: Job) => {
  logger.info({ job: "auto-absence-queue" }, "Processing auto-absence job");
  await runAutoAbsenceJob();
});

autoAbsenceQueue.on("failed", (job, err) => {
  logger.error({ err, jobId: job.id, attempts: job.attemptsMade }, "Auto-absence job failed");
});

autoAbsenceQueue.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Auto-absence job completed");
});
