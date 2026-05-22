import { AppError } from "../errors/app-error";

const LOCK_WINDOW_HOURS = 24;
const LOCK_WINDOW_MS = LOCK_WINDOW_HOURS * 60 * 60 * 1000;

type EditLockInput = {
  createdAt?: Date;
  baseAt?: Date;
  lockWindowHours?: number;
  resource: string;
};

type VersionInput = {
  currentVersion: number;
  expectedVersion?: number | null;
  resource: string;
};

export const editLockPolicy = {
  lockWindowHours: LOCK_WINDOW_HOURS,

  lockUntil(baseAt: Date, lockWindowHours = LOCK_WINDOW_HOURS): Date {
    return new Date(baseAt.getTime() + lockWindowHours * 60 * 60 * 1000);
  },

  resolveBaseAt(input: EditLockInput): Date {
    const baseAt = input.baseAt ?? input.createdAt;
    if (!baseAt) {
      throw new AppError("Edit lock base time is missing", 500, { resource: input.resource });
    }
    return baseAt;
  },

  isEditable(input: EditLockInput): boolean {
    const baseAt = this.resolveBaseAt(input);
    return this.lockUntil(baseAt, input.lockWindowHours).getTime() > Date.now();
  },

  assertEditable(input: EditLockInput): void {
    if (this.isEditable(input)) {
      return;
    }

    const baseAt = this.resolveBaseAt(input);
    const lockWindowHours = input.lockWindowHours ?? LOCK_WINDOW_HOURS;
    const lockedAt = this.lockUntil(baseAt, lockWindowHours);

    throw new AppError(
      `${input.resource} is locked after ${lockWindowHours} hours. Submit correction request.`,
      409,
      {
        resource: input.resource,
        lockWindowHours,
        baseAt: baseAt.toISOString(),
        lockedAt: lockedAt.toISOString()
      },
      "LOCKED_RECORD"
    );
  },

  assertVersionMatch(input: VersionInput): void {
    if (input.expectedVersion === undefined || input.expectedVersion === null) {
      return;
    }

    if (input.expectedVersion === input.currentVersion) {
      return;
    }

    throw new AppError(
      `${input.resource} version conflict`,
      409,
      {
        resource: input.resource,
        expectedVersion: input.expectedVersion,
        currentVersion: input.currentVersion
      },
      "VERSION_CONFLICT"
    );
  }
};
