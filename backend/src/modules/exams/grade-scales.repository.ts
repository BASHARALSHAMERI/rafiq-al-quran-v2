import { PrismaClient } from "@prisma/client";
import type { GradeScaleBody } from "./grade-scales.validation";

const gradeScaleSelect = {
  id: true,
  label: true,
  minPercentage: true,
  maxPercentage: true,
  color: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const;

export type GradeScaleRow = {
  id: number;
  label: string;
  minPercentage: number;
  maxPercentage: number;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function createGradeScalesRepository(prisma: PrismaClient) {
  return {
    async findAll(organizationId: number): Promise<GradeScaleRow[]> {
      const rows = await prisma.examGradeScale.findMany({
        where: { organizationId },
        select: gradeScaleSelect,
        orderBy: [{ sortOrder: "asc" }, { minPercentage: "desc" }]
      });
      return rows.map((r) => ({
        ...r,
        minPercentage: Number(r.minPercentage),
        maxPercentage: Number(r.maxPercentage)
      }));
    },

    async findActive(organizationId: number): Promise<GradeScaleRow[]> {
      const rows = await prisma.examGradeScale.findMany({
        where: { organizationId, isActive: true },
        select: gradeScaleSelect,
        orderBy: [{ sortOrder: "asc" }, { minPercentage: "desc" }]
      });
      return rows.map((r) => ({
        ...r,
        minPercentage: Number(r.minPercentage),
        maxPercentage: Number(r.maxPercentage)
      }));
    },

    async create(organizationId: number, data: GradeScaleBody): Promise<GradeScaleRow> {
      const row = await prisma.examGradeScale.create({
        data: {
          organizationId,
          label: data.label,
          minPercentage: data.minPercentage,
          maxPercentage: data.maxPercentage,
          color: data.color ?? null,
          sortOrder: data.sortOrder ?? 0,
          isActive: data.isActive ?? true
        },
        select: gradeScaleSelect
      });
      return {
        ...row,
        minPercentage: Number(row.minPercentage),
        maxPercentage: Number(row.maxPercentage)
      };
    },

    async update(id: number, organizationId: number, data: Partial<GradeScaleBody>): Promise<GradeScaleRow | null> {
      const existing = await prisma.examGradeScale.findFirst({ where: { id, organizationId } });
      if (!existing) return null;
      const row = await prisma.examGradeScale.update({
        where: { id },
        data: {
          ...(data.label !== undefined && { label: data.label }),
          ...(data.minPercentage !== undefined && { minPercentage: data.minPercentage }),
          ...(data.maxPercentage !== undefined && { maxPercentage: data.maxPercentage }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          ...(data.isActive !== undefined && { isActive: data.isActive })
        },
        select: gradeScaleSelect
      });
      return {
        ...row,
        minPercentage: Number(row.minPercentage),
        maxPercentage: Number(row.maxPercentage)
      };
    },

    async delete(id: number, organizationId: number): Promise<boolean> {
      const existing = await prisma.examGradeScale.findFirst({ where: { id, organizationId } });
      if (!existing) return false;
      await prisma.examGradeScale.delete({ where: { id } });
      return true;
    },

    async seedDefaults(organizationId: number): Promise<void> {
      const count = await prisma.examGradeScale.count({ where: { organizationId } });
      if (count > 0) return;

      const defaults = [
        { label: "ممتاز", minPercentage: 95, maxPercentage: 100, color: "#10b981", sortOrder: 1 },
        { label: "جيد جداً", minPercentage: 85, maxPercentage: 94.99, color: "#3b82f6", sortOrder: 2 },
        { label: "جيد", minPercentage: 75, maxPercentage: 84.99, color: "#6366f1", sortOrder: 3 },
        { label: "مقبول", minPercentage: 65, maxPercentage: 74.99, color: "#f59e0b", sortOrder: 4 },
        { label: "راسب", minPercentage: 0, maxPercentage: 64.99, color: "#ef4444", sortOrder: 5 }
      ];

      await prisma.examGradeScale.createMany({
        data: defaults.map((d) => ({ organizationId, ...d }))
      });
    }
  };
}
