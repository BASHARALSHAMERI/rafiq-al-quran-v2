import { AppError } from "../errors/app-error";

const durationRegex = /^(\d+)([smhd])$/;

const unitToMs: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
};

export const durationToMs = (duration: string): number => {
  const match = duration.trim().match(durationRegex);

  if (!match) {
    throw new AppError(`Unsupported duration format: ${duration}`, 500);
  }

  const value = Number(match[1]);
  const unit = match[2];

  return value * unitToMs[unit];
};

export const safeDate = (input: string, fieldName: string): Date => {
  const value = new Date(input);

  if (Number.isNaN(value.getTime())) {
    throw new AppError(`Invalid date value for ${fieldName}`, 400);
  }

  return value;
};

export const toDateOnly = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};