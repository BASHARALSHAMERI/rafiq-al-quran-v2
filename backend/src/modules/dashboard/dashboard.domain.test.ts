import { dashboardDomain } from "./dashboard.domain";

describe("dashboardDomain.staffAttendanceRate", () => {
  it("counts present and late records as attended", () => {
    expect(dashboardDomain.staffAttendanceRate(6, 2, 2)).toBe(80);
  });

  it("excludes excused, leave, and missing records by accepting only accountable statuses", () => {
    expect(dashboardDomain.staffAttendanceRate(0, 0, 0)).toBe(0);
  });
});
