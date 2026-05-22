import {
  EnrollmentStatus,
  Prisma,
  type LibraryItemStatus,
  type LibraryVisibility
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import {
  activeCenterWhere,
  activeCircleWhere,
  activeUserWhere
} from "../../shared/policies/active-read.policy";

const categorySelect = {
  id: true,
  organizationId: true,
  centerId: true,
  name: true,
  code: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  }
} satisfies Prisma.LibraryCategorySelect;

const itemSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  circleId: true,
  categoryId: true,
  bookCategory: true,
  title: true,
  description: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  storageKey: true,
  coverStorageKey: true,
  visibility: true,
  type: true,
  status: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  circle: {
    select: {
      id: true,
      name: true,
      centerId: true
    }
  },
  category: {
    select: {
      id: true,
      name: true,
      code: true,
      centerId: true
    }
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  }
} satisfies Prisma.LibraryItemSelect;

export const libraryRepository = {
  async findCenterById(input: { organizationId: number; centerId: number }) {
    return prisma.center.findFirst({
      where: activeCenterWhere({
        id: input.centerId,
        organizationId: input.organizationId
      }),
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true
      }
    });
  },

  async findCircleById(input: { organizationId: number; circleId: number }) {
    return prisma.circle.findFirst({
      where: activeCircleWhere({
        id: input.circleId,
        center: activeCenterWhere({
          organizationId: input.organizationId
        })
      }),
      select: {
        id: true,
        centerId: true,
        name: true
      }
    });
  },

  async findCategoryById(input: { organizationId: number; categoryId: number }) {
    return prisma.libraryCategory.findFirst({
      where: {
        id: input.categoryId,
        organizationId: input.organizationId
      },
      select: categorySelect
    });
  },

  async listCategories(input: {
    organizationId: number;
    requestedCenterId?: number;
    accessibleCenterIds?: number[];
  }) {
    let centerVisibilityFilter: Prisma.LibraryCategoryWhereInput;

    if (typeof input.requestedCenterId === "number") {
      centerVisibilityFilter = {
        OR: [{ centerId: null }, { centerId: input.requestedCenterId }]
      };
    } else if (input.accessibleCenterIds) {
      centerVisibilityFilter = input.accessibleCenterIds.length
        ? {
            OR: [{ centerId: null }, { centerId: { in: input.accessibleCenterIds } }]
          }
        : {
            centerId: null
          };
    } else {
      centerVisibilityFilter = {};
    }

    return prisma.libraryCategory.findMany({
      where: {
        organizationId: input.organizationId,
        ...centerVisibilityFilter
      },
      orderBy: [{ centerId: "asc" }, { name: "asc" }],
      select: categorySelect
    });
  },

  async createCategory(input: {
    organizationId: number;
    centerId?: number | null;
    name: string;
    code: string;
  }) {
    return prisma.libraryCategory.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId ?? null,
        name: input.name,
        code: input.code
      },
      select: categorySelect
    });
  },

  async listItems(input: {
    organizationId: number;
    where?: Prisma.LibraryItemWhereInput;
    skip: number;
    take: number;
  }) {
    const where: Prisma.LibraryItemWhereInput = {
      organizationId: input.organizationId,
      ...(input.where ?? {})
    };

    const [items, total] = await prisma.$transaction([
      prisma.libraryItem.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: input.skip,
        take: input.take,
        select: itemSelect
      }),
      prisma.libraryItem.count({ where })
    ]);

    return { items, total };
  },

  async createItem(input: {
    organizationId: number;
    centerId?: number | null;
    circleId?: number | null;
    categoryId?: number | null;
    title: string;
    description?: string | null;
    fileName: string;
    mimeType: string;
    fileSize: number;
    storageKey: string;
    coverStorageKey?: string | null;
    bookCategory?: import("@prisma/client").BookCategory | null;
    visibility: LibraryVisibility;
    type: import("@prisma/client").LibraryItemType;
    createdById: number;
  }) {
    return prisma.libraryItem.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId ?? null,
        circleId: input.circleId ?? null,
        categoryId: input.categoryId ?? null,
        title: input.title,
        description: input.description ?? null,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        storageKey: input.storageKey,
        coverStorageKey: input.coverStorageKey ?? null,
        bookCategory: input.bookCategory ?? null,
        visibility: input.visibility,
        type: input.type,
        createdById: input.createdById
      },
      select: itemSelect
    });
  },

  async findItemById(input: { organizationId: number; itemId: number }) {
    return prisma.libraryItem.findFirst({
      where: {
        id: input.itemId,
        organizationId: input.organizationId
      },
      select: itemSelect
    });
  },

  async updateItem(input: {
    itemId: number;
    title?: string;
    description?: string | null;
    categoryId?: number | null;
    bookCategory?: import("@prisma/client").BookCategory | null;
    centerId?: number | null;
    circleId?: number | null;
    visibility?: LibraryVisibility;
    status?: LibraryItemStatus;
    type?: import("@prisma/client").LibraryItemType;
    coverStorageKey?: string | null;
  }) {
    return prisma.libraryItem.update({
      where: {
        id: input.itemId
      },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.bookCategory !== undefined ? { bookCategory: input.bookCategory } : {}),
        ...(input.centerId !== undefined ? { centerId: input.centerId } : {}),
        ...(input.circleId !== undefined ? { circleId: input.circleId } : {}),
        ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.coverStorageKey !== undefined ? { coverStorageKey: input.coverStorageKey } : {})
      },
      select: itemSelect
    });
  },

  async resolveScopeFromStudentIds(input: {
    organizationId: number;
    studentIds: number[];
  }) {
    if (!input.studentIds.length) {
      return {
        centerIds: [],
        circleIds: []
      };
    }

    const enrollments = await prisma.studentCircleEnrollment.findMany({
      where: {
        studentId: {
          in: input.studentIds
        },
        status: EnrollmentStatus.ACTIVE,
        student: activeUserWhere({
          organizationId: input.organizationId
        }),
        circle: activeCircleWhere({
          center: activeCenterWhere({
            organizationId: input.organizationId
          })
        })
      },
      select: {
        circleId: true,
        circle: {
          select: {
            centerId: true
          }
        }
      }
    });

    return {
      centerIds: [...new Set(enrollments.map((item) => item.circle.centerId))],
      circleIds: [...new Set(enrollments.map((item) => item.circleId))]
    };
  }
};
