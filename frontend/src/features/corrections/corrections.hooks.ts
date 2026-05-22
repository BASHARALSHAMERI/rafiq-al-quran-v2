import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { correctionsApi } from "./corrections.api";
import type {
  ApproveCorrectionPayload,
  CreateCorrectionPayload,
  ListCorrectionsQuery,
  RejectCorrectionPayload
} from "./types";

const listKey = (query: ListCorrectionsQuery) =>
  [
    query.status ?? null,
    query.targetType ?? null,
    query.centerId ?? null,
    query.circleId ?? null,
    query.page ?? 1,
    query.pageSize ?? 20
  ] as const;

export const CORRECTIONS_QUERY_KEYS = {
  all: ["corrections"] as const,
  list: (query: ListCorrectionsQuery) => [...CORRECTIONS_QUERY_KEYS.all, "list", ...listKey(query)] as const
};

export const useCorrectionsQuery = (query: ListCorrectionsQuery, enabled = true) => {
  return useQuery({
    queryKey: CORRECTIONS_QUERY_KEYS.list(query),
    queryFn: () => correctionsApi.list(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 10_000
  });
};

const invalidateCorrections = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: CORRECTIONS_QUERY_KEYS.all }),
    queryClient.invalidateQueries({ queryKey: ["follow-ups"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["reports"] })
  ]);
};

export const useCreateCorrectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCorrectionPayload) => correctionsApi.create(payload),
    onSuccess: async () => {
      await invalidateCorrections(queryClient);
    }
  });
};

export const useApproveCorrectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { correctionId: number; payload: ApproveCorrectionPayload }) =>
      correctionsApi.approve(input.correctionId, input.payload),
    onSuccess: async () => {
      await invalidateCorrections(queryClient);
    }
  });
};

export const useRejectCorrectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { correctionId: number; payload: RejectCorrectionPayload }) =>
      correctionsApi.reject(input.correctionId, input.payload),
    onSuccess: async () => {
      await invalidateCorrections(queryClient);
    }
  });
};
