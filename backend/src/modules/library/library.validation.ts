import { BookCategory, LibraryItemStatus, LibraryItemType, LibraryVisibility } from "@prisma/client";
import { z } from "zod";

export const libraryItemIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

export const listLibraryCategoriesQuerySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional()
  })
  .strict();

export const createLibraryCategoryBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().min(2).max(80),
    centerId: z.coerce.number().int().positive().optional()
  })
  .strict();

export const listLibraryItemsQuerySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional(),
    circleId: z.coerce.number().int().positive().optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    q: z.string().trim().max(120).optional(),
    visibility: z.nativeEnum(LibraryVisibility).optional(),
    status: z.nativeEnum(LibraryItemStatus).optional(),
    type: z.nativeEnum(LibraryItemType).optional(),
    bookCategory: z.nativeEnum(BookCategory).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

export const createLibraryItemBodySchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(2000).optional(),
    centerId: z.coerce.number().int().positive().optional(),
    circleId: z.coerce.number().int().positive().optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    bookCategory: z.nativeEnum(BookCategory).optional(),
    visibility: z.nativeEnum(LibraryVisibility),
    type: z.nativeEnum(LibraryItemType)
  })
  .strict();

export const updateLibraryItemBodySchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    centerId: z.coerce.number().int().positive().nullable().optional(),
    circleId: z.coerce.number().int().positive().nullable().optional(),
    categoryId: z.coerce.number().int().positive().nullable().optional(),
    bookCategory: z.nativeEnum(BookCategory).nullable().optional(),
    visibility: z.nativeEnum(LibraryVisibility).optional(),
    status: z.nativeEnum(LibraryItemStatus).optional(),
    type: z.nativeEnum(LibraryItemType).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حقل واحد على الأقل مطلوب"
  });

