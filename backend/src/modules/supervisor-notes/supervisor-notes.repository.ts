import { Prisma, SupervisorNoteCategory, SupervisorNoteStatus } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

export type SupervisorNoteRow = {
  id: number;
  organizationId: number;
  centerId: number;
  circleId: number | null;
  supervisorId: number;
  category: SupervisorNoteCategory;
  status: SupervisorNoteStatus;
  targetLabel: string | null;
  content: string;
  scores: Prisma.JsonValue;
  visitChecklist: Prisma.JsonValue;
  rating: number | null;
  createdAt: Date;
  updatedAt: Date;
  supervisor: { id: number; fullName: string } | null;
  circle: { id: number; name: string } | null;
};

const select = {
  id: true,
  organizationId: true,
  centerId: true,
  circleId: true,
  supervisorId: true,
  category: true,
  status: true,
  targetLabel: true,
  content: true,
  scores: true,
  visitChecklist: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
  supervisor: { select: { id: true, fullName: true } },
  circle: { select: { id: true, name: true } },
} satisfies Prisma.SupervisorNoteSelect;

export const supervisorNotesRepository = {
  async list(params: {
    organizationId: number;
    centerId?: number;
    circleId?: number;
    category?: SupervisorNoteCategory;
    status?: SupervisorNoteStatus;
    centerIds?: number[];
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.SupervisorNoteWhereInput = {
      organizationId: params.organizationId,
      ...(params.centerId ? { centerId: params.centerId } : {}),
      ...(params.circleId ? { circleId: params.circleId } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.centerIds?.length ? { centerId: { in: params.centerIds } } : {}),
    };

    const skip = (params.page - 1) * params.pageSize;
    const [data, total] = await prisma.$transaction([
      prisma.supervisorNote.findMany({
        where,
        select,
        orderBy: { createdAt: "desc" },
        skip,
        take: params.pageSize,
      }),
      prisma.supervisorNote.count({ where }),
    ]);

    return { data, total };
  },

  async create(data: {
    organizationId: number;
    centerId: number;
    circleId?: number | null;
    supervisorId: number;
    category: SupervisorNoteCategory;
    targetLabel?: string | null;
    content: string;
    scores?: Prisma.InputJsonValue;
    visitChecklist?: Prisma.InputJsonValue;
    rating?: number | null;
  }) {
    return prisma.supervisorNote.create({
      data: {
        organizationId: data.organizationId,
        centerId: data.centerId,
        circleId: data.circleId ?? null,
        supervisorId: data.supervisorId,
        category: data.category,
        targetLabel: data.targetLabel ?? null,
        content: data.content,
        scores: data.scores ?? Prisma.JsonNull,
        visitChecklist: data.visitChecklist ?? Prisma.JsonNull,
        rating: data.rating ?? null,
      },
      select,
    });
  },

  async updateStatus(id: number, organizationId: number, status: SupervisorNoteStatus) {
    return prisma.supervisorNote.update({
      where: { id, organizationId },
      data: { status },
      select,
    });
  },

  async findById(id: number, organizationId: number) {
    return prisma.supervisorNote.findFirst({
      where: { id, organizationId },
      select,
    });
  },
};
