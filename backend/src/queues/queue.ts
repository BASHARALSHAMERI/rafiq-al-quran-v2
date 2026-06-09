// @ts-nocheck
// TODO: Remove after installing bull + ioredis
import Queue from "bull";
import { env } from "../config/env";

const REDIS_URL = env.REDIS_URL ?? "redis://localhost:6379";

export const QUEUE_NAMES = {
  AUTO_ABSENCE: "auto-absence",
  STAFF_SHIFT_REMINDER: "staff-shift-reminder",
  VISIT_ATTENDANCE_DERIVATION: "visit-attendance-derivation",
} as const;

function createQueue(name: string) {
  return new Queue(name, REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 60_000 },
      removeOnComplete: { age: 7 * 24 * 60 * 60 }, // 7 days
      removeOnFail: { age: 30 * 24 * 60 * 60 }, // 30 days
    },
  });
}

export const autoAbsenceQueue = createQueue(QUEUE_NAMES.AUTO_ABSENCE);
export const staffShiftReminderQueue = createQueue(QUEUE_NAMES.STAFF_SHIFT_REMINDER);
export const visitAttendanceDerivationQueue = createQueue(QUEUE_NAMES.VISIT_ATTENDANCE_DERIVATION);

export async function closeQueues(): Promise<void> {
  await autoAbsenceQueue.close();
  await staffShiftReminderQueue.close();
  await visitAttendanceDerivationQueue.close();
}
