import type { PrismaClient } from "@prisma/client";
import { createGradeScalesRepository, type GradeScaleRow } from "./grade-scales.repository";
import type { GradeScaleBody } from "./grade-scales.validation";

export type GradeScaleItem = {
  id: number;
  label: string;
  minPercentage: number;
  maxPercentage: number;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function toItem(row: GradeScaleRow): GradeScaleItem {
  return {
    id: row.id,
    label: row.label,
    minPercentage: row.minPercentage,
    maxPercentage: row.maxPercentage,
    color: row.color,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function createGradeScalesService(prisma: PrismaClient) {
  const repo = createGradeScalesRepository(prisma);

  return {
    async listAll(organizationId: number): Promise<GradeScaleItem[]> {
      // Auto-seed defaults on first access
      await repo.seedDefaults(organizationId);
      const rows = await repo.findAll(organizationId);
      return rows.map(toItem);
    },

    async listActive(organizationId: number): Promise<GradeScaleItem[]> {
      await repo.seedDefaults(organizationId);
      const rows = await repo.findActive(organizationId);
      return rows.map(toItem);
    },

    async create(organizationId: number, body: GradeScaleBody): Promise<GradeScaleItem> {
      const row = await repo.create(organizationId, body);
      return toItem(row);
    },

    async update(id: number, organizationId: number, body: Partial<GradeScaleBody>): Promise<GradeScaleItem | null> {
      const row = await repo.update(id, organizationId, body);
      if (!row) return null;
      return toItem(row);
    },

    async delete(id: number, organizationId: number): Promise<boolean> {
      return repo.delete(id, organizationId);
    },

    /**
     * Resolve grade label for a given percentage using org's custom scale.
     * Falls back to hardcoded defaults if no scales found.
     */
    async resolveLabel(organizationId: number, percentage: number): Promise<string> {
      const scales = await repo.findActive(organizationId);

      if (scales.length === 0) {
        // Fallback hardcoded
        if (percentage >= 95) return "ممتاز";
        if (percentage >= 85) return "جيد جداً";
        if (percentage >= 75) return "جيد";
        if (percentage >= 65) return "مقبول";
        return "راسب";
      }

      // Find matching scale (sorted desc by minPercentage)
      const match = scales
        .sort((a, b) => b.minPercentage - a.minPercentage)
        .find((s) => percentage >= s.minPercentage);

      return match?.label ?? "غير محدد";
    }
  };
}
