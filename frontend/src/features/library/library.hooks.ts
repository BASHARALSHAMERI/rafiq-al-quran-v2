import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { libraryApi } from "./library.api";
import type {
  CreateLibraryItemPayload,
  LibraryItemsQueryParams,
  UpdateLibraryItemPayload
} from "./types";

export const LIBRARY_QUERY_KEYS = {
  all: ["library"] as const,
  categories: (centerId?: number) =>
    [...LIBRARY_QUERY_KEYS.all, "categories", centerId ?? null] as const,
  items: (params: LibraryItemsQueryParams) =>
    [
      ...LIBRARY_QUERY_KEYS.all,
      "items",
      params.centerId ?? null,
      params.circleId ?? null,
      params.categoryId ?? null,
      params.q ?? "",
      params.visibility ?? null,
      params.status ?? null,
      params.page ?? 1,
      params.pageSize ?? 10
    ] as const
};

export const useLibraryCategoriesQuery = (centerId?: number) => {
  return useQuery({
    queryKey: LIBRARY_QUERY_KEYS.categories(centerId),
    queryFn: () => libraryApi.getCategories(centerId),
    staleTime: 60_000
  });
};

export const useLibraryItemsQuery = (params: LibraryItemsQueryParams) => {
  return useQuery({
    queryKey: LIBRARY_QUERY_KEYS.items(params),
    queryFn: () => libraryApi.getItems(params),
    placeholderData: keepPreviousData
  });
};

export const useUploadLibraryItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLibraryItemPayload) => libraryApi.uploadItem(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: LIBRARY_QUERY_KEYS.all
      });
    }
  });
};

export const useUpdateLibraryItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { itemId: number; payload: UpdateLibraryItemPayload }) =>
      libraryApi.updateItem(input.itemId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: LIBRARY_QUERY_KEYS.all
      });
    }
  });
};

export const useArchiveLibraryItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => libraryApi.archiveItem(itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: LIBRARY_QUERY_KEYS.all
      });
    }
  });
};

export const useDownloadLibraryItemMutation = () => {
  return useMutation({
    mutationFn: (itemId: number) => libraryApi.downloadItem(itemId)
  });
};
