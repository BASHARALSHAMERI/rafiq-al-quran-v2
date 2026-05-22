import { createReadStream } from "node:fs";
import path from "node:path";
import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { buildAttachmentContentDisposition } from "../../shared/utils/files";
import { libraryService } from "./library.service";

export const libraryController = {
  listCategories: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as {
        centerId?: number;
      };

      const categories = await libraryService.listCategories(req.scope, query);

      res.json({ ok: true, data: categories });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createCategory: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const category = await libraryService.createCategory(req.scope, req.body);
      res.status(201).json({ ok: true, data: category });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listItems: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as {
        centerId?: number;
        circleId?: number;
        categoryId?: number;
        q?: string;
        visibility?: import("@prisma/client").LibraryVisibility;
        status?: import("@prisma/client").LibraryItemStatus;
        type?: import("@prisma/client").LibraryItemType;
        bookCategory?: import("@prisma/client").BookCategory;
        page?: number;
        pageSize?: number;
      };

      const result = await libraryService.listItems(req.scope, query);

      res.json({
        ok: true,
        data: result.data,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createItem: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedFile = files?.file?.[0];
      const uploadedCover = files?.cover?.[0];

      const item = await libraryService.createItem(
        req.scope,
        req.body,
        uploadedFile
          ? {
              originalName: uploadedFile.originalname,
              mimeType: uploadedFile.mimetype,
              size: uploadedFile.size,
              buffer: uploadedFile.buffer
            }
          : undefined,
        uploadedCover
          ? {
              originalName: uploadedCover.originalname,
              mimeType: uploadedCover.mimetype,
              size: uploadedCover.size,
              buffer: uploadedCover.buffer
            }
          : undefined
      );

      res.status(201).json({ ok: true, data: item });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  downloadItem: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const { item, absolutePath } = await libraryService.getDownloadableItem(req.scope, params.id);

      res.setHeader("Content-Type", item.mimeType);
      res.setHeader("Content-Length", String(item.fileSize));
      res.setHeader("Content-Disposition", buildAttachmentContentDisposition(item.fileName));

      const fileStream = createReadStream(absolutePath);
      fileStream.on("error", next);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getItemCover: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const { item, absolutePath } = await libraryService.getCover(req.scope, params.id);

      // تحديد نوع الصورة من الامتداد الفعلي للملف المحفوظ
      const ext = path.extname(item.coverStorageKey ?? "").toLowerCase();
      const mimeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
      };
      const contentType = mimeMap[ext] ?? "image/jpeg";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

      const fileStream = createReadStream(absolutePath);
      fileStream.on("error", next);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateItem: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const item = await libraryService.updateItem(req.scope, params.id, req.body);

      res.json({ ok: true, data: item });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  archiveItem: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const item = await libraryService.archiveItem(req.scope, params.id);

      res.json({ ok: true, data: item });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
