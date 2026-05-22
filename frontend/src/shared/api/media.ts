import { apiClient } from "./http";
import type { ApiResponse } from "./types";

export type ImageUploadKind = "USER_AVATAR" | "CENTER_LOGO" | "ORG_LOGO";

export type UploadedImage = {
  kind: ImageUploadKind;
  storageKey: string;
  url: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
};

export const mediaApi = {
  async uploadImage(file: File, kind: ImageUploadKind): Promise<UploadedImage> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await apiClient.post<ApiResponse<UploadedImage>>("/media/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    return response.data.data;
  }
};

