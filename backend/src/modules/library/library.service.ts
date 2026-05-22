import { access } from "node:fs/promises";
import {
  AuditAction,
  AuditEntityType,
  Prisma,
  Role,
  type LibraryItemStatus,
  LibraryItemType,
  type LibraryVisibility
} from "@prisma/client";
import { auditLogger } from "../../shared/audit/audit-log";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { libraryDomain } from "./library.domain";
import { libraryRepository } from "./library.repository";
import { LIBRARY_MAX_FILE_SIZE_BYTES, libraryStorage } from "./library.storage";

type AccessWindow = {
  allAccess: boolean;
  centerIds: number[];
  circleIds: number[];
};

const hasCenterAccess = (accessWindow: AccessWindow, centerId: number): boolean => {
  if (accessWindow.allAccess) {
    return true;
  }

  return accessWindow.centerIds.includes(centerId);
};

const hasCircleAccess = (accessWindow: AccessWindow, circleId: number): boolean => {
  if (accessWindow.allAccess) {
    return true;
  }

  return accessWindow.circleIds.includes(circleId);
};

type ListCategoriesQuery = {
  centerId?: number;
};

type CreateCategoryInput = {
  name: string;
  code: string;
  centerId?: number;
};

type ListItemsQuery = {
  centerId?: number;
  circleId?: number;
  categoryId?: number;
  q?: string;
  visibility?: LibraryVisibility;
  status?: LibraryItemStatus;
  type?: LibraryItemType;
  bookCategory?: import("@prisma/client").BookCategory;
  page?: number;
  pageSize?: number;
};

type CreateItemInput = {
  title: string;
  description?: string;
  centerId?: number;
  circleId?: number;
  categoryId?: number;
  bookCategory?: import("@prisma/client").BookCategory;
  visibility: LibraryVisibility;
  type: LibraryItemType;
};

type UpdateItemInput = {
  title?: string;
  description?: string | null;
  bookCategory?: import("@prisma/client").BookCategory | null;
  centerId?: number | null;
  circleId?: number | null;
  categoryId?: number | null;
  visibility?: LibraryVisibility;
  status?: LibraryItemStatus;
  type?: LibraryItemType;
};

type UploadedLibraryFile = {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};

const resolveAccessWindow = async (scope: ScopeContext): Promise<AccessWindow> => {
  if (scope.allAccess) {
    return {
      allAccess: true,
      centerIds: [],
      circleIds: []
    };
  }

  if (scope.role !== Role.PARENT) {
    return {
      allAccess: false,
      centerIds: scope.centerIds,
      circleIds: scope.circleIds
    };
  }

  const fromStudents = await libraryRepository.resolveScopeFromStudentIds({
    organizationId: scope.organizationId,
    studentIds: scope.studentIds
  });

  return {
    allAccess: false,
    centerIds: fromStudents.centerIds,
    circleIds: fromStudents.circleIds
  };
};

const resolveWriteVisibilityScope = async (
  scope: ScopeContext,
  accessWindow: AccessWindow,
  input: {
    visibility: LibraryVisibility;
    centerId?: number | null;
    circleId?: number | null;
  }
) => {
  libraryDomain.assertVisibilityPayload(input);

  if (input.visibility === "ORG") {
    if (scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("Only super admin can create ORG visibility items", 403);
    }

    return {
      centerId: null,
      circleId: null
    };
  }

  if (input.visibility === "CENTER") {
    const centerId = input.centerId as number;

    libraryDomain.assertCenterInAccess(accessWindow, centerId);

    const center = await libraryRepository.findCenterById({
      organizationId: scope.organizationId,
      centerId
    });

    if (!center) {
      throw new AppError("Center not found", 404);
    }

    return {
      centerId: center.id,
      circleId: null
    };
  }

  const circleId = input.circleId as number;
  libraryDomain.assertCircleInAccess(accessWindow, circleId);

  const circle = await libraryRepository.findCircleById({
    organizationId: scope.organizationId,
    circleId
  });

  if (!circle) {
    throw new AppError("Circle not found", 404);
  }

  libraryDomain.assertCenterInAccess(accessWindow, circle.centerId);

  if (input.centerId && input.centerId !== circle.centerId) {
    throw new AppError("circleId does not belong to selected center", 400);
  }

  return {
    centerId: circle.centerId,
    circleId: circle.id
  };
};

const ensureCategoryCompatibility = async (input: {
  organizationId: number;
  categoryId?: number | null;
  centerId?: number | null;
}) => {
  if (input.categoryId === undefined) {
    return undefined;
  }

  if (input.categoryId === null) {
    return null;
  }

  const category = await libraryRepository.findCategoryById({
    organizationId: input.organizationId,
    categoryId: input.categoryId
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (category.centerId && category.centerId !== input.centerId) {
    throw new AppError("Category does not belong to selected center scope", 400);
  }

  return category.id;
};

const buildVisibilityReadCondition = (accessWindow: AccessWindow): Prisma.LibraryItemWhereInput => {
  if (accessWindow.allAccess) {
    return {};
  }

  const orConditions: Prisma.LibraryItemWhereInput[] = [{ visibility: "ORG" }];

  if (accessWindow.centerIds.length) {
    orConditions.push({
      visibility: "CENTER",
      centerId: {
        in: accessWindow.centerIds
      }
    });
  }

  if (accessWindow.circleIds.length) {
    orConditions.push({
      visibility: "CIRCLE",
      circleId: {
        in: accessWindow.circleIds
      }
    });
  }

  return {
    OR: orConditions
  };
};

export const libraryService = {
  async listCategories(scope: ScopeContext, query: ListCategoriesQuery) {
    libraryDomain.assertCanView(scope);

    const accessWindow = await resolveAccessWindow(scope);
    const scopedCenterId =
      typeof query.centerId === "number" && hasCenterAccess(accessWindow, query.centerId)
        ? query.centerId
        : undefined;

    return libraryRepository.listCategories({
      organizationId: scope.organizationId,
      requestedCenterId: scopedCenterId,
      accessibleCenterIds: accessWindow.allAccess ? undefined : accessWindow.centerIds
    });
  },

  async createCategory(scope: ScopeContext, input: CreateCategoryInput) {
    libraryDomain.assertCanManageCategories(scope);

    const accessWindow = await resolveAccessWindow(scope);
    const normalizedCode = libraryDomain.normalizeCategoryCode(input.code);

    if (!normalizedCode) {
      throw new AppError("Category code is invalid", 400);
    }

    if (!input.centerId && scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("centerId is required for your role", 400);
    }

    if (input.centerId) {
      libraryDomain.assertCenterInAccess(accessWindow, input.centerId);

      const center = await libraryRepository.findCenterById({
        organizationId: scope.organizationId,
        centerId: input.centerId
      });

      if (!center) {
        throw new AppError("Center not found", 404);
      }
    }

    try {
      return await libraryRepository.createCategory({
        organizationId: scope.organizationId,
        centerId: input.centerId ?? null,
        name: input.name.trim(),
        code: normalizedCode
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Category code already exists", 409);
      }

      throw error;
    }
  },

  async listItems(scope: ScopeContext, query: ListItemsQuery) {
    libraryDomain.assertCanView(scope);

    const accessWindow = await resolveAccessWindow(scope);
    const scopedCenterId =
      typeof query.centerId === "number" && hasCenterAccess(accessWindow, query.centerId)
        ? query.centerId
        : undefined;
    const scopedCircleId =
      typeof query.circleId === "number" && hasCircleAccess(accessWindow, query.circleId)
        ? query.circleId
        : undefined;

    const pagination = libraryDomain.resolvePagination(query.page, query.pageSize);
    const andConditions: Prisma.LibraryItemWhereInput[] = [
      buildVisibilityReadCondition(accessWindow),
      {
        status: query.status ?? "ACTIVE"
      }
    ];

    if (scopedCenterId) {
      andConditions.push({ centerId: scopedCenterId });
    }

    if (scopedCircleId) {
      andConditions.push({ circleId: scopedCircleId });
    }

    if (query.categoryId) {
      andConditions.push({ categoryId: query.categoryId });
    }

    if (query.visibility) {
      andConditions.push({ visibility: query.visibility });
    }

    if (query.bookCategory) {
      andConditions.push({ bookCategory: query.bookCategory });
    }
    
    if (query.type) {
      andConditions.push({ type: query.type });
    }

    if (query.q?.trim()) {
      andConditions.push({
        OR: [
          { title: { contains: query.q.trim() } },
          { description: { contains: query.q.trim() } },
          { fileName: { contains: query.q.trim() } }
        ]
      });
    }

    const { items, total } = await libraryRepository.listItems({
      organizationId: scope.organizationId,
      where: {
        AND: andConditions
      },
      skip: pagination.skip,
      take: pagination.take
    });

    return {
      data: items,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total
    };
  },

  async createItem(
    scope: ScopeContext,
    input: CreateItemInput,
    file?: UploadedLibraryFile,
    cover?: UploadedLibraryFile
  ) {
    libraryDomain.assertCanWriteItems(scope);

    if (!file) {
      throw new AppError("File upload is required", 400);
    }

    if (!libraryStorage.isAllowedMimeType(file.mimeType)) {
      throw new AppError("Unsupported file type", 400);
    }

    if (file.size > LIBRARY_MAX_FILE_SIZE_BYTES) {
      throw new AppError("Uploaded file exceeds size limit", 413, undefined, "PAYLOAD_TOO_LARGE");
    }

    // Strict MIME-type to LibraryItemType enforcement
    const mime = file.mimeType.toLowerCase();
    if (input.type === LibraryItemType.AUDIO && !mime.startsWith("audio/")) {
      throw new AppError("Payload type is AUDIO but file content is not an audio family", 400);
    }
    if (input.type === LibraryItemType.VIDEO && !mime.startsWith("video/")) {
      throw new AppError("Payload type is VIDEO but file content is not a video family", 400);
    }
    if (
      input.type === LibraryItemType.DOCUMENT &&
      !(mime.startsWith("application/") || mime.startsWith("image/") || mime.startsWith("text/"))
    ) {
      throw new AppError("Payload type is DOCUMENT but file content is not a document/image family", 400);
    }

    const accessWindow = await resolveAccessWindow(scope);
    const visibilityScope = await resolveWriteVisibilityScope(scope, accessWindow, {
      visibility: input.visibility,
      centerId: input.centerId,
      circleId: input.circleId
    });

    if (scope.role === Role.TEACHER && input.visibility === "ORG") {
      throw new AppError("Teacher cannot upload ORG visibility items", 403);
    }

    const categoryId = await ensureCategoryCompatibility({
      organizationId: scope.organizationId,
      categoryId: input.categoryId,
      centerId: visibilityScope.centerId
    });

    const savedFile = await libraryStorage.saveFile({
      organizationId: scope.organizationId,
      centerId: visibilityScope.centerId,
      mimeType: file.mimeType,
      originalFileName: file.originalName,
      buffer: file.buffer
    });

    let coverStorageKey: string | null = null;
    if (cover) {
      const savedCover = await libraryStorage.saveFile({
        organizationId: scope.organizationId,
        centerId: visibilityScope.centerId,
        mimeType: cover.mimeType,
        originalFileName: cover.originalName,
        buffer: cover.buffer
      });
      coverStorageKey = savedCover.storageKey;
    }

    try {
      const item = await libraryRepository.createItem({
        organizationId: scope.organizationId,
        centerId: visibilityScope.centerId,
        circleId: visibilityScope.circleId,
        categoryId: categoryId ?? undefined,
        bookCategory: input.bookCategory ?? null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        fileName: file.originalName,
        mimeType: file.mimeType,
        fileSize: file.size,
        storageKey: savedFile.storageKey,
        coverStorageKey,
        visibility: input.visibility,
        type: input.type,
        createdById: scope.userId
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: item.centerId,
        circleId: item.circleId,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.LIBRARY_ITEM,
        entityId: item.id,
        summary: "تم رفع ملف للمكتبة",
        metadata: {
          title: item.title,
          visibility: item.visibility,
          categoryId: item.categoryId
        }
      });

      return item;
    } catch (error) {
      await libraryStorage.deleteByStorageKey(savedFile.storageKey);
      if (coverStorageKey) {
        await libraryStorage.deleteByStorageKey(coverStorageKey);
      }
      throw error;
    }
  },

  async getDownloadableItem(scope: ScopeContext, itemId: number) {
    libraryDomain.assertCanView(scope);

    const accessWindow = await resolveAccessWindow(scope);
    const item = await libraryRepository.findItemById({
      organizationId: scope.organizationId,
      itemId
    });

    if (!item || item.status === "ARCHIVED") {
      throw new AppError("Library item not found", 404);
    }

    if (
      !libraryDomain.isItemVisible(accessWindow, {
        visibility: item.visibility,
        centerId: item.centerId,
        circleId: item.circleId
      })
    ) {
      throw new AppError("Library item is outside your scope", 403);
    }

    const absolutePath = libraryStorage.resolveAbsolutePath(item.storageKey);

    try {
      await access(absolutePath);
    } catch {
      throw new AppError("Library file is missing from storage", 404);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: item.centerId,
      circleId: item.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DOWNLOAD,
      entityType: AuditEntityType.LIBRARY_ITEM,
      entityId: item.id,
      summary: "تم تنزيل ملف من المكتبة",
      metadata: {
        title: item.title,
        visibility: item.visibility
      }
    });

    return {
      item,
      absolutePath
    };
  },

  async getCover(scope: ScopeContext, itemId: number) {
    libraryDomain.assertCanView(scope);

    const accessWindow = await resolveAccessWindow(scope);
    const item = await libraryRepository.findItemById({
      organizationId: scope.organizationId,
      itemId
    });

    if (!item || item.status === "ARCHIVED") {
      throw new AppError("Library item not found", 404);
    }

    if (
      !libraryDomain.isItemVisible(accessWindow, {
        visibility: item.visibility,
        centerId: item.centerId,
        circleId: item.circleId
      })
    ) {
      throw new AppError("Library item is outside your scope", 403);
    }

    if (!item.coverStorageKey) {
      throw new AppError("Library item does not have a cover", 404);
    }

    const absolutePath = libraryStorage.resolveAbsolutePath(item.coverStorageKey);

    try {
      await access(absolutePath);
    } catch {
      throw new AppError("Library cover image is missing from storage", 404);
    }

    return {
      item,
      absolutePath
    };
  },

  async updateItem(scope: ScopeContext, itemId: number, input: UpdateItemInput) {
    libraryDomain.assertCanWriteItems(scope);

    const accessWindow = await resolveAccessWindow(scope);
    const existingItem = await libraryRepository.findItemById({
      organizationId: scope.organizationId,
      itemId
    });

    if (!existingItem) {
      throw new AppError("Library item not found", 404);
    }

    if (
      !libraryDomain.isItemVisible(accessWindow, {
        visibility: existingItem.visibility,
        centerId: existingItem.centerId,
        circleId: existingItem.circleId
      })
    ) {
      throw new AppError("Library item is outside your scope", 403);
    }

    libraryDomain.assertTeacherOwnsItem(scope, existingItem.createdById);

    const nextVisibility = input.visibility ?? existingItem.visibility;
    const nextCenterId = input.centerId !== undefined ? input.centerId : existingItem.centerId;
    const nextCircleId = input.circleId !== undefined ? input.circleId : existingItem.circleId;

    const resolvedScope = await resolveWriteVisibilityScope(scope, accessWindow, {
      visibility: nextVisibility,
      centerId: nextCenterId,
      circleId: nextCircleId
    });

    const nextCategoryId =
      input.categoryId !== undefined ? input.categoryId : existingItem.categoryId;
    const resolvedCategoryId = await ensureCategoryCompatibility({
      organizationId: scope.organizationId,
      categoryId: nextCategoryId,
      centerId: resolvedScope.centerId
    });

    const item = await libraryRepository.updateItem({
      itemId,
      title: input.title?.trim(),
      description:
        input.description === undefined ? undefined : (input.description?.trim() || null),
      categoryId:
        input.categoryId === undefined ? undefined : resolvedCategoryId ?? null,
      bookCategory: input.bookCategory,
      centerId:
        input.visibility !== undefined || input.centerId !== undefined || input.circleId !== undefined
          ? resolvedScope.centerId
          : undefined,
      circleId:
        input.visibility !== undefined || input.centerId !== undefined || input.circleId !== undefined
          ? resolvedScope.circleId
          : undefined,
      visibility: input.visibility,
      status: input.status
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: item.centerId,
      circleId: item.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.LIBRARY_ITEM,
      entityId: item.id,
      summary: "تم تعديل عنصر في المكتبة",
      metadata: {
        before: {
          title: existingItem.title,
          visibility: existingItem.visibility,
          status: existingItem.status,
          centerId: existingItem.centerId,
          circleId: existingItem.circleId
        },
        after: {
          title: item.title,
          visibility: item.visibility,
          status: item.status,
          centerId: item.centerId,
          circleId: item.circleId
        }
      }
    });

    return item;
  },

  async archiveItem(scope: ScopeContext, itemId: number) {
    libraryDomain.assertCanWriteItems(scope);

    const accessWindow = await resolveAccessWindow(scope);
    const existingItem = await libraryRepository.findItemById({
      organizationId: scope.organizationId,
      itemId
    });

    if (!existingItem) {
      throw new AppError("Library item not found", 404);
    }

    if (
      !libraryDomain.isItemVisible(accessWindow, {
        visibility: existingItem.visibility,
        centerId: existingItem.centerId,
        circleId: existingItem.circleId
      })
    ) {
      throw new AppError("Library item is outside your scope", 403);
    }

    libraryDomain.assertTeacherOwnsItem(scope, existingItem.createdById);

    const item = await libraryRepository.updateItem({
      itemId,
      status: "ARCHIVED"
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: item.centerId,
      circleId: item.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.ARCHIVE,
      entityType: AuditEntityType.LIBRARY_ITEM,
      entityId: item.id,
      summary: "تم أرشفة عنصر مكتبة",
      metadata: {
        title: item.title,
        status: item.status
      }
    });

    return item;
  }
};
