import { describe, it, expect } from "vitest";
import { buildAttendanceWindow } from "./staff-operations.service";

describe("buildAttendanceWindow", () => {
  it("should correctly calculate checkIn and checkOut windows for a standard shift", () => {
    const shiftStart = new Date("2026-07-09T08:00:00Z"); // 08:00 UTC
    const shiftEnd = new Date("2026-07-09T12:00:00Z"); // 12:00 UTC
    const attendanceDate = new Date("2026-07-09T00:00:00Z");

    const window = buildAttendanceWindow({
      attendanceDate,
      shiftStart,
      shiftEnd,
      checkInBeforeMinutes: 60,
      checkInAfterMinutes: 60,
    });

    // Check-in opens 60 mins before 08:00 => 07:00
    expect(window.checkInOpenAt?.toISOString()).toBe("2026-07-09T07:00:00.000Z");
    
    // Check-in closes 60 mins after 08:00 => 09:00
    expect(window.checkInCloseAt?.toISOString()).toBe("2026-07-09T09:00:00.000Z");

    // Absent due at is equal to checkInCloseAt
    expect(window.absentDueAt?.toISOString()).toBe("2026-07-09T09:00:00.000Z");

    // Shift duration = 4 hours = 240 mins
    // Check-out opens half-shift (120 mins) before 12:00 => 10:00
    expect(window.checkOutOpenAt?.toISOString()).toBe("2026-07-09T10:00:00.000Z");
    
    // Check-out closes 60 mins after 12:00 => 13:00
    expect(window.checkOutCloseAt?.toISOString()).toBe("2026-07-09T13:00:00.000Z");
  });

  it("should correctly calculate windows for an overnight shift", () => {
    const shiftStart = new Date("2026-07-09T22:00:00Z"); // 22:00 UTC
    const shiftEnd = new Date("2026-07-10T00:00:00Z"); // 00:00 UTC next day
    const attendanceDate = new Date("2026-07-09T00:00:00Z");

    const window = buildAttendanceWindow({
      attendanceDate,
      shiftStart,
      shiftEnd,
      checkInBeforeMinutes: 60,
      checkInAfterMinutes: 60,
    });

    // Check-in opens 60 mins before 22:00 => 21:00
    expect(window.checkInOpenAt?.toISOString()).toBe("2026-07-09T21:00:00.000Z");
    
    // Check-in closes 60 mins after 22:00 => 23:00
    expect(window.checkInCloseAt?.toISOString()).toBe("2026-07-09T23:00:00.000Z");

    // Absent due at = 23:00
    expect(window.absentDueAt?.toISOString()).toBe("2026-07-09T23:00:00.000Z");

    // Shift duration = 2 hours = 120 mins
    // Check-out opens half-shift (60 mins) before 00:00 => 23:00
    expect(window.checkOutOpenAt?.toISOString()).toBe("2026-07-09T23:00:00.000Z");
    
    // Check-out closes 60 mins after 00:00 => 01:00
    expect(window.checkOutCloseAt?.toISOString()).toBe("2026-07-10T01:00:00.000Z");
  });

  it("should handle null shifts gracefully", () => {
    const window = buildAttendanceWindow({
      attendanceDate: new Date("2026-07-09T00:00:00Z"),
      shiftStart: null,
      shiftEnd: null,
      checkInBeforeMinutes: 60,
      checkInAfterMinutes: 60,
    });

    expect(window.checkInOpenAt).toBeNull();
    expect(window.checkInCloseAt).toBeNull();
    expect(window.checkOutOpenAt).toBeNull();
    expect(window.checkOutCloseAt).toBeNull();
    expect(window.absentDueAt).toBeNull();
    expect(window.shiftDurationMinutes).toBe(0);
  });
});
