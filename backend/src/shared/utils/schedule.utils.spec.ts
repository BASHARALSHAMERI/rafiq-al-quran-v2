import { describe, it, expect } from "vitest";
import { isValidScheduleTimeRange } from "./schedule.utils";

describe("isValidScheduleTimeRange", () => {
  it("should validate a standard daytime shift", () => {
    const result = isValidScheduleTimeRange("08:00", "12:00");
    expect(result.isValid).toBe(true);
    expect(result.durationMinutes).toBe(240); // 4 hours
  });

  it("should validate an overnight shift (early night)", () => {
    const result = isValidScheduleTimeRange("22:00", "00:00");
    expect(result.isValid).toBe(true);
    expect(result.durationMinutes).toBe(120); // 2 hours
  });

  it("should validate an overnight shift (late night)", () => {
    const result = isValidScheduleTimeRange("23:00", "01:00");
    expect(result.isValid).toBe(true);
    expect(result.durationMinutes).toBe(120); // 2 hours
  });

  it("should reject when fromTime equals toTime", () => {
    const result = isValidScheduleTimeRange("10:00", "10:00");
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe("same_time");
    expect(result.durationMinutes).toBe(0);
  });

  it("should reject when duration is less than minimum", () => {
    const result = isValidScheduleTimeRange("08:00", "08:10"); // 10 minutes
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe("too_short");
    expect(result.durationMinutes).toBe(10);
  });

  it("should reject when duration is more than maximum", () => {
    const result = isValidScheduleTimeRange("08:00", "01:00"); // 17 hours
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe("too_long");
    expect(result.durationMinutes).toBe(17 * 60);
  });

  it("should reject invalid time format", () => {
    const result = isValidScheduleTimeRange("25:00", "12:00");
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe("invalid_format");
  });
});
