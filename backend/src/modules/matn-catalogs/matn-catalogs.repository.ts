import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

const matnSelect = {
  id: true,
  organizationId: true,
  code: true,
  titleAr: true,
  titleEn: true,
  category: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.MatnCatalogSelect;

export type MatnItem = Prisma.MatnCatalogGetPayload<{
  select: typeof matnSelect;
}>;

export const matnCatalogsRepository = {

  async list(organizationId: number, input: {
    category?: string;
    isActive?: boolean;
    search?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.MatnCatalogWhereInput = {
      organizationId,
      ...(input.category ? { category: input.category } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.search
        ? {
            OR: [
              { titleAr: { contains: input.search, mode: "insensitive" } },
              { titleEn: { contains: input.search, mode: "insensitive" } },
              { code: { contains: input.search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [data, total] = await Promise.all([
      prisma.matnCatalog.findMany({
        where,
        orderBy: [{ category: "asc" }, { titleAr: "asc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: matnSelect
      }),
      prisma.matnCatalog.count({ where })
    ]);

    return { data, total };
  },

  async findById(id: number, organizationId: number) {
    return prisma.matnCatalog.findFirst({
      where: { id, organizationId },
      select: matnSelect
    });
  },

  async create(input: {
    organizationId: number;
    code: string;
    titleAr: string;
    titleEn?: string | null;
    category: string;
    isActive?: boolean;
  }) {
    return prisma.matnCatalog.create({
      data: {
        organizationId: input.organizationId,
        code: input.code,
        titleAr: input.titleAr,
        titleEn: input.titleEn ?? null,
        category: input.category,
        isActive: input.isActive ?? true
      },
      select: matnSelect
    });
  },

  async update(id: number, organizationId: number, input: {
    code?: string;
    titleAr?: string;
    titleEn?: string | null;
    category?: string;
    isActive?: boolean;
  }) {
    return prisma.matnCatalog.update({
      where: { id },
      data: input,
      select: matnSelect
    });
  },

  async remove(id: number, organizationId: number) {
    return prisma.matnCatalog.delete({
      where: { id },
      select: matnSelect
    });
  }
};
