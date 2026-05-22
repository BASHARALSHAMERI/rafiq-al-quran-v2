import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../../shared/errors/app-error";
import { metrics } from "../../shared/metrics/metrics";
import { MEDIA_ALLOWED_IMAGE_MIME_TYPES, MEDIA_MAX_FILE_SIZE_BYTES } from "./media.storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: MEDIA_MAX_FILE_SIZE_BYTES
  },
  fileFilter: (_req, file, callback) => {
    if (!MEDIA_ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as never)) {
      callback(
        new AppError(
          `Unsupported image type. Allowed: ${MEDIA_ALLOWED_IMAGE_MIME_TYPES.join(", ")}`,
          400,
          undefined,
          "UNSUPPORTED_IMAGE_TYPE"
        )
      );
      return;
    }

    callback(null, true);
  }
});

export const uploadMediaImage: RequestHandler = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      if (req.file) {
        metrics.recordUploadAccepted("media");
      }
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      metrics.recordUploadRejected("media");

      if (error.code === "LIMIT_FILE_SIZE") {
        next(
          new AppError(
            `Image exceeds ${Math.floor(MEDIA_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB limit`,
            413,
            undefined,
            "PAYLOAD_TOO_LARGE"
          )
        );
        return;
      }

      next(new AppError(error.message, 400));
      return;
    }

    metrics.recordUploadRejected("media");
    next(error);
  });
};

