import type { AxiosResponse } from "axios";
import { apiClient } from "../../shared/api/http";
import { useAuthStore } from "../auth/auth.store";
import type { ApiResponse } from "../../shared/api/types";
import type {
  CreateLibraryItemPayload,
  LibraryCategory,
  LibraryItem,
  LibraryItemsQueryParams,
  LibraryItemsResult,
  UpdateLibraryItemPayload
} from "./types";

type CategoryPayload = LibraryCategory[] | { items: LibraryCategory[] };

type ListItemsPayload = LibraryItem[] | { items: LibraryItem[] };

type ListItemsResponse = ApiResponse<ListItemsPayload> & {
  page?: number;
  pageSize?: number;
  total?: number;
};

const normalizeCategories = (payload: CategoryPayload): LibraryCategory[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.items;
};

const normalizeItems = (response: AxiosResponse<ListItemsResponse>): LibraryItemsResult => {
  const payload = response.data.data;
  const data = Array.isArray(payload) ? payload : payload.items;
  const fallbackPageSize = data.length || 10;

  return {
    data,
    page: response.data.page ?? 1,
    pageSize: response.data.pageSize ?? fallbackPageSize,
    total: response.data.total ?? data.length
  };
};

const extractFileNameFromContentDisposition = (contentDisposition?: string): string => {
  if (!contentDisposition) {
    return "library-file";
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

  return basicMatch?.[1] ?? "library-file";
};

export const libraryApi = {
  async getCategories(centerId?: number) {
    const response = await apiClient.get<ApiResponse<CategoryPayload>>("/library/categories", {
      params: {
        centerId
      }
    });

    return normalizeCategories(response.data.data);
  },

  async getItems(params: LibraryItemsQueryParams) {
    const response = await apiClient.get<ListItemsResponse>("/library/items", {
      params: {
        centerId: params.centerId,
        circleId: params.circleId,
        categoryId: params.categoryId,
        q: params.q,
        visibility: params.visibility,
        status: params.status,
        type: params.type,
        bookCategory: params.bookCategory,
        page: params.page,
        pageSize: params.pageSize
      }
    });

    return normalizeItems(response);
  },

  async uploadItem(payload: CreateLibraryItemPayload) {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("visibility", payload.visibility);
    formData.append("type", payload.type);
    formData.append("file", payload.file);

    if (payload.description?.trim()) {
      formData.append("description", payload.description.trim());
    }

    if (payload.centerId) {
      formData.append("centerId", String(payload.centerId));
    }

    if (payload.circleId) {
      formData.append("circleId", String(payload.circleId));
    }

    if (payload.categoryId) {
      formData.append("categoryId", String(payload.categoryId));
    }

    if (payload.bookCategory) {
      formData.append("bookCategory", payload.bookCategory);
    }

    if (payload.cover) {
      formData.append("cover", payload.cover);
    }

    const response = await apiClient.post<ApiResponse<LibraryItem>>("/library/items", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    return response.data.data;
  },

  async updateItem(itemId: number, payload: UpdateLibraryItemPayload) {
    const response = await apiClient.patch<ApiResponse<LibraryItem>>(
      `/library/items/${itemId}`,
      payload
    );

    return response.data.data;
  },

  async archiveItem(itemId: number) {
    const response = await apiClient.delete<ApiResponse<LibraryItem>>(`/library/items/${itemId}`);
    return response.data.data;
  },

  async downloadItem(itemId: number) {
    const response = await apiClient.get<Blob>(`/library/items/${itemId}/download`, {
      responseType: "blob"
    });

    const fileName = extractFileNameFromContentDisposition(
      response.headers["content-disposition"]
    );

    return {
      blob: response.data,
      fileName,
      mimeType: response.headers["content-type"] ?? "application/octet-stream"
    };
  },

  getItemCoverUrl(itemId: number) {
    const base = apiClient.defaults.baseURL?.replace(/\/+$/, "") || "";
    const token = useAuthStore.getState().accessToken;
    return `${base}/library/items/${itemId}/cover${token ? `?token=${token}` : ""}`;
  }
};

