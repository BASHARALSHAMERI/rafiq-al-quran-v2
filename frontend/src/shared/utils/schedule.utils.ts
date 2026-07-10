export const isValidScheduleTimeRange = (
  fromTime: string,
  toTime: string,
  minDurationMinutes: number = 15,
  maxDurationMinutes: number = 16 * 60 // 16 hours
): { isValid: boolean; errorKey?: "invalid_format" | "same_time" | "too_short" | "too_long"; durationMinutes: number } => {
  const hhmmRe = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!hhmmRe.test(fromTime) || !hhmmRe.test(toTime)) {
    return { isValid: false, errorKey: "invalid_format", durationMinutes: 0 };
  }

  if (fromTime === toTime) {
    return { isValid: false, errorKey: "same_time", durationMinutes: 0 };
  }

  const [fromH, fromM] = fromTime.split(":").map(Number);
  const [toH, toM] = toTime.split(":").map(Number);

  const fromMinutes = fromH * 60 + fromM;
  const toMinutes = toH * 60 + toM;

  let durationMinutes = 0;
  if (fromMinutes < toMinutes) {
    durationMinutes = toMinutes - fromMinutes;
  } else {
    // Overnight shift: crosses midnight
    durationMinutes = 24 * 60 - fromMinutes + toMinutes;
  }

  if (durationMinutes < minDurationMinutes) {
    return { isValid: false, errorKey: "too_short", durationMinutes };
  }

  if (durationMinutes > maxDurationMinutes) {
    return { isValid: false, errorKey: "too_long", durationMinutes };
  }

  return { isValid: true, durationMinutes };
};
