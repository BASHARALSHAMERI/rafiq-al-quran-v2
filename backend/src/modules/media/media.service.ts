import type { MediaImageKind } from "./media.storage";
import { mediaStorage } from "./media.storage";

export const mediaService = {
  async uploadImage(input: {
    organizationId: number;
    kind: MediaImageKind;
    file: {
      originalName: string;
      mimeType: string;
      size: number;
      buffer: Buffer;
    };
  }) {
    const saved = await mediaStorage.saveImage({
      organizationId: input.organizationId,
      kind: input.kind,
      mimeType: input.file.mimeType,
      originalFileName: input.file.originalName,
      buffer: input.file.buffer
    });

    return {
      kind: input.kind,
      storageKey: saved.storageKey,
      mimeType: input.file.mimeType,
      fileSize: input.file.size,
      fileName: input.file.originalName
    };
  }
};

