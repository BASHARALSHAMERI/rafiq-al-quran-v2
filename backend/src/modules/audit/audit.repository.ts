import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import {
  activeCenterWhere,
  activeCircleWhere,
  activeUserWhere
} from "../../shared/policies/active-read.policy";

const auditLogSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  circleId: true,
  actorUserId: true,
  actorRole: true,
  action: true,
  entityType: true,
  entityId: true,
  summary: true,
  metadata: true,
  ip: true,
  userAgent: true,
  createdAt: true,
  actor: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  center: {
    select: {
      id: true,
      name: true
    }
  },
  circle: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.AuditLogSelect;

export const auditRepository = {
  async listRows(input: {
    where: Prisma.AuditLogWhereInput;
    skip: number;
    take: number;
  }) {
    return prisma.auditLog.findMany({
      where: input.where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: input.skip,
      take: input.take,
      select: auditLogSelect
    });
  },

  async countRows(where: Prisma.AuditLogWhereInput) {
    return prisma.auditLog.count({
      where
    });
  },

  async listActors(where: Prisma.AuditLogWhereInput) {
    const rows = await prisma.auditLog.findMany({
      where: {
        ...where,
        actorUserId: {
          not: null
        },
        actor: activeUserWhere()
      },
      distinct: ["actorUserId"],
      orderBy: [{ actorUserId: "asc" }],
      select: {
        actorUserId: true,
        actor: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    return rows
      .map((row) => row.actor)
      .filter((actor): actor is NonNullable<typeof actor> => Boolean(actor));
  },

  async listCentersByOrganization(organizationId: number) {
    return prisma.center.findMany({
      where: activeCenterWhere({
        organizationId
      }),
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true
      }
    });
  },

  async listCentersByIds(input: { organizationId: number; centerIds: number[] }) {
    if (!input.centerIds.length) {
      return [];
    }

    return prisma.center.findMany({
      where: activeCenterWhere({
        organizationId: input.organizationId,
        id: {
          in: input.centerIds
        }
      }),
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true
      }
    });
  },

  async listCirclesByOrganization(organizationId: number) {
    return prisma.circle.findMany({
      where: activeCircleWhere({
        center: activeCenterWhere({
          organizationId
        })
      }),
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        centerId: true
      }
    });
  },

  async listCirclesByIds(input: { organizationId: number; circleIds: number[] }) {
    if (!input.circleIds.length) {
      return [];
    }

    return prisma.circle.findMany({
      where: activeCircleWhere({
        id: {
          in: input.circleIds
        },
        center: activeCenterWhere({
          organizationId: input.organizationId
        })
      }),
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        centerId: true
      }
    });
  }
};
