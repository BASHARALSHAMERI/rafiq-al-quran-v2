import { Prisma, type NotificationType } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import type { NotificationsDateRange } from "./notifications.domain";

type DbClient = Prisma.TransactionClient | typeof prisma;

const notificationSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  circleId: true,
  type: true,
  title: true,
  body: true,
  payload: true,
  recipientUserId: true,
  isRead: true,
  createdById: true,
  createdAt: true,
  readAt: true,
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
  },
  recipient: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  }
} satisfies Prisma.NotificationSelect;

const buildWhere = (input: {
  organizationId: number;
  recipientUserId: number;
  isRead?: boolean;
  type?: NotificationType;
  range?: NotificationsDateRange;
  scopeWhere?: Prisma.NotificationWhereInput;
  onlyUnread?: boolean;
}) => {
  const where: Prisma.NotificationWhereInput = {
    organizationId: input.organizationId,
    recipientUserId: input.recipientUserId,
    ...(input.onlyUnread ? { isRead: false } : {}),
    ...(typeof input.isRead === "boolean" ? { isRead: input.isRead } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.range
      ? {
          createdAt: {
            gte: input.range.from,
            lte: input.range.to
          }
        }
      : {})
  };

  if (!input.scopeWhere) {
    return where;
  }

  return {
    AND: [where, input.scopeWhere]
  } satisfies Prisma.NotificationWhereInput;
};

export const notificationsRepository = {
  async findActiveCenterSupervisorRecipients(input: {
    organizationId: number;
    centerId: number;
  }, db: DbClient = prisma) {
    return db.centerSupervisor.findMany({
      where: {
        centerId: input.centerId,
        isActive: true,
        center: {
          organizationId: input.organizationId
        },
        supervisor: {
          isActive: true,
          role: "SUPERVISOR",
          supervisorProfile: {
            is: {
              status: "ACTIVE"
            }
          }
        }
      },
      orderBy: [{ supervisor: { fullName: "asc" } }, { id: "asc" }],
      select: {
        supervisorUserId: true,
        supervisor: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });
  },

  async createMany(
    input: { data: Prisma.NotificationCreateManyInput[] },
    db: DbClient = prisma
  ) {
    if (!input.data.length) {
      return { count: 0 };
    }

    return db.notification.createMany({
      data: input.data
    });
  },

  async list(input: {
    organizationId: number;
    recipientUserId: number;
    isRead?: boolean;
    type?: NotificationType;
    range?: NotificationsDateRange;
    scopeWhere?: Prisma.NotificationWhereInput;
    skip: number;
    take: number;
  }) {
    const where = buildWhere(input);

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: input.skip,
        take: input.take,
        select: notificationSelect
      }),
      prisma.notification.count({
        where
      })
    ]);

    return { items, total };
  },

  async listUnpaginated(input: {
    organizationId: number;
    recipientUserId: number;
    isRead?: boolean;
    type?: NotificationType;
    range?: NotificationsDateRange;
    scopeWhere?: Prisma.NotificationWhereInput;
  }) {
    return prisma.notification.findMany({
      where: buildWhere(input),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: notificationSelect
    });
  },

  async countUnread(input: {
    organizationId: number;
    recipientUserId: number;
    type?: NotificationType;
    range?: NotificationsDateRange;
    scopeWhere?: Prisma.NotificationWhereInput;
  }) {
    return prisma.notification.count({
      where: buildWhere({
        organizationId: input.organizationId,
        recipientUserId: input.recipientUserId,
        type: input.type,
        range: input.range,
        scopeWhere: input.scopeWhere,
        onlyUnread: true
      })
    });
  },

  async findByIdForRecipient(input: {
    id: number;
    organizationId: number;
    recipientUserId: number;
  }) {
    return prisma.notification.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        recipientUserId: input.recipientUserId
      },
      select: notificationSelect
    });
  },

  async markRead(input: { id: number; readAt: Date }) {
    return prisma.notification.update({
      where: {
        id: input.id
      },
      data: {
        isRead: true,
        readAt: input.readAt
      },
      select: notificationSelect
    });
  },

  async markManyReadByIds(input: { ids: number[]; readAt: Date }) {
    if (!input.ids.length) {
      return { count: 0 };
    }

    return prisma.notification.updateMany({
      where: {
        id: {
          in: input.ids
        },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: input.readAt
      }
    });
  },

  async markAllRead(input: {
    organizationId: number;
    recipientUserId: number;
    isRead?: boolean;
    type?: NotificationType;
    range?: NotificationsDateRange;
    scopeWhere?: Prisma.NotificationWhereInput;
    readAt: Date;
  }) {
    return prisma.notification.updateMany({
      where: buildWhere({
        organizationId: input.organizationId,
        recipientUserId: input.recipientUserId,
        isRead: input.isRead,
        type: input.type,
        range: input.range,
        scopeWhere: input.scopeWhere,
        onlyUnread: true
      }),
      data: {
        isRead: true,
        readAt: input.readAt
      }
    });
  }
};
