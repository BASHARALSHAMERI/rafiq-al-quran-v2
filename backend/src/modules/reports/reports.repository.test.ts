jest.mock("../../shared/db/prisma", () => ({
  prisma: { user: { findMany: jest.fn() } }
}));

import { prisma } from "../../shared/db/prisma";
import { reportsRepository } from "./reports.repository";

describe("reportsRepository.studentsSummary", () => {
  it("limits students and displayed enrollment to the selected center and circle", async () => {
    const findMany = prisma.user.findMany as jest.Mock;
    findMany.mockResolvedValue([]);

    await reportsRepository.studentsSummary({
      organizationId: 1,
      centerIds: [10],
      circleIds: [20]
    });

    const enrollmentWhere = {
      status: "ACTIVE",
      circle: {
        id: { in: [20] },
        center: { organizationId: 1, id: { in: [10] } }
      }
    };

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentEnrollments: { some: enrollmentWhere }
        }),
        select: expect.objectContaining({
          studentEnrollments: expect.objectContaining({ where: enrollmentWhere })
        })
      })
    );
  });
});