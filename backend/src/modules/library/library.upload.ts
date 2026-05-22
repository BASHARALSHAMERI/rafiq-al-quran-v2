import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../../shared/errors/app-error";
import { metrics } from "../../shared/metrics/metrics";
import {
  LIBRARY_ALLOWED_MIME_TYPES,
  LIBRARY_MAX_FILE_SIZE_BYTES,
  libraryStorage
} from "./library.storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 2,
    fileSize: LIBRARY_MAX_FILE_SIZE_BYTES
  },
  fileFilter: (_req, file, callback) => {
    if (!libraryStorage.isAllowedMimeType(file.mimetype)) {
      callback(
        new AppError(
          `Unsupported file type. Allowed: ${LIBRARY_ALLOWED_MIME_TYPES.join(", ")}`,
          400
        )
      );
      return;
    }

    callback(null, true);
  }
});

export const uploadLibraryFile: RequestHandler = (req, res, next) => {
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "cover", maxCount: 1 }
  ])(req, res, (error) => {
    if (!error) {
      if (req.file || (req.files && (req.files as any).file)) {
        metrics.recordUploadAccepted("library");
      }
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        metrics.recordUploadRejected("library");
        next(
          new AppError(
            `File exceeds ${Math.floor(LIBRARY_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB limit`,
            413,
            undefined,
            "PAYLOAD_TOO_LARGE"
          )
        );
        return;
      }

      metrics.recordUploadRejected("library");
      next(new AppError(error.message, 400));
      return;
    }

    metrics.recordUploadRejected("library");
    next(error);
  });
};
