import { Prisma, SupervisorNoteCategory, SupervisorNoteStatus } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import type { ScopeContext } from "../../shared/types/auth.types";
import { supervisorNotesRepository, type SupervisorNoteRow } from "./supervisor-notes.repository";

export type CreateSupervisorNoteInput = {
  centerId?: number;
  circleId?: number;
  category: SupervisorNoteCategory;
  targetLabel?: string;
  content: string;
  scores?: Record<string, number>;
  visitChecklist?: { label: string; checked: boolean }[];
  rating?: number;
};

export type ListSupervisorNotesInput = {
  centerId?: number;
  circleId?: number;
  category?: SupervisorNoteCategory;
  status?: SupervisorNoteStatus;
  page?: number;
  pageSize?: number;
};

const serialize = (row: SupervisorNoteRow) => ({
  id: row.id,
  organizationId: row.organizationId,
  centerId: row.centerId,
  circleId: row.circleId,
  supervisorId: row.supervisorId,
  supervisorName: row.supervisor?.fullName ?? null,
  circleName: row.circle?.name ?? null,
  category: row.category,
  status: row.status,
  targetLabel: row.targetLabel,
  content: row.content,
  scores: row.scores,
  visitChecklist: row.visitChecklist,
  rating: row.rating,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const supervisorNotesService = {
  async list(scope: ScopeContext, query: ListSupervisorNotesInput) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));

    if (query.centerId !== undefined) {
      ensureCenterAllowed(scope, query.centerId);
    }
    if (query.circleId !== undefined) {
      ensureCircleAllowed(scope, query.circleId);
    }

    const result = await supervisorNotesRepository.list({
      organizationId: scope.organizationId,
      centerId: query.centerId,
      circleId: query.circleId,
      category: query.category,
      status: query.status,
      centerIds: scope.allAccess ? undefined : scope.centerIds,
      page,
      pageSize,
    });

    return {
      data: result.data.map(serialize),
      page,
      pageSize,
      total: result.total,
    };
  },

  async create(scope: ScopeContext, input: CreateSupervisorNoteInput) {
    const requestedCenterId = input.centerId;
    if (requestedCenterId !== undefined && !scope.allAccess) {
      ensureCenterAllowed(scope, requestedCenterId);
    }

    let resolvedCenterId = requestedCenterId ?? scope.centerIds[0];
    if (input.circleId !== undefined) {
      ensureCircleAllowed(scope, input.circleId);
      const existingCircle = await prisma.circle.findFirst({
        where: {
          id: input.circleId,
          center: {
            organizationId: scope.organizationId
          }
        },
        select: {
          centerId: true
        }
      });
      if (!existingCircle) {
        throw new AppError("Circle not found", 404);
      }
      resolvedCenterId = existingCircle.centerId;
    }

    if (!resolvedCenterId && !scope.allAccess) {
      throw new AppError("Supervisor must belong to at least one center", 400);
    }

    if (!resolvedCenterId) {
      throw new AppError("centerId is required for this note", 400);
    }

    const row = await supervisorNotesRepository.create({
      organizationId: scope.organizationId,
      centerId: resolvedCenterId,
      circleId: input.circleId ?? null,
      supervisorId: scope.userId,
      category: input.category,
      targetLabel: input.targetLabel,
      content: input.content,
      scores: input.scores ? (JSON.parse(JSON.stringify(input.scores)) as Prisma.InputJsonValue) : undefined,
      visitChecklist: input.visitChecklist
        ? (JSON.parse(JSON.stringify(input.visitChecklist)) as Prisma.InputJsonValue)
        : undefined,
      rating: input.rating,
    });

    return serialize(row);
  },

  async updateStatus(scope: ScopeContext, id: number, status: SupervisorNoteStatus) {
    const existing = await supervisorNotesRepository.findById(id, scope.organizationId);
    if (!existing) {
      throw new AppError("Supervisor note not found", 404);
    }

    if (!scope.allAccess) {
      ensureCenterAllowed(scope, existing.centerId);
    }

    const updated = await supervisorNotesRepository.updateStatus(id, scope.organizationId, status);
    return serialize(updated!);
  },
};
