import type { Prisma } from "@prisma/client";

type ActiveReadOptions = {
  includeInactive?: boolean;
};

export const activeUserWhere = (
  where: Prisma.UserWhereInput = {},
  options?: ActiveReadOptions
): Prisma.UserWhereInput => {
  if (options?.includeInactive) {
    return where;
  }

  return {
    AND: [where, { isActive: true }]
  };
};

export const activeCenterWhere = (
  where: Prisma.CenterWhereInput = {},
  options?: ActiveReadOptions
): Prisma.CenterWhereInput => {
  if (options?.includeInactive) {
    return where;
  }

  return {
    AND: [where, { isActive: true }]
  };
};

export const activeCircleWhere = (
  where: Prisma.CircleWhereInput = {},
  options?: ActiveReadOptions
): Prisma.CircleWhereInput => {
  if (options?.includeInactive) {
    return where;
  }

  return {
    AND: [where, { isActive: true }]
  };
};
