import { env } from "../config/env";
import { logger } from "../shared/logger/logger";
import { runAutoAbsenceJob } from "./auto-absence.job";
import { runStaffShiftReminderJob } from "./staff-shift-reminder.job";
import { runVisitAttendanceDerivationJob } from "./visit-attendance-derivation.job";

const JOB_INTERVAL_MS = 5 * 60_000;
const INITIAL_DELAY_MS = 15_000;

let started = false;
let running = false;

const runCycle = async () => {
  if (running) {
    logger.warn({ job: "background-jobs" }, "Previous background job cycle is still running");
    return;
  }

  running = true;

  try {
    await runStaffShiftReminderJob();
    await runAutoAbsenceJob();
    await runVisitAttendanceDerivationJob();
  } catch (error) {
    logger.error({ err: error, job: "background-jobs" }, "Background job cycle failed");
  } finally {
    running = false;
  }
};

export const startBackgroundJobs = () => {
  if (!env.BACKGROUND_JOBS_ENABLED) {
    logger.info({ job: "background-jobs" }, "Background jobs are disabled");
    return;
  }

  if (started) {
    return;
  }

  started = true;
  logger.info(
    { job: "background-jobs", intervalMs: JOB_INTERVAL_MS },
    "Starting background jobs"
  );

  setTimeout(() => {
    void runCycle();
  }, INITIAL_DELAY_MS);

  setInterval(() => {
    void runCycle();
  }, JOB_INTERVAL_MS);
};
