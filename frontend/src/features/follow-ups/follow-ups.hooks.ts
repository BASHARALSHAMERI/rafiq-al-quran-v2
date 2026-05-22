import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followUpsApi } from "./follow-ups.api";
import type { CreateFollowUpPayload, FollowUpsListQuery, UpdateFollowUpPayload } from "./types";

const listKey = (query: FollowUpsListQuery) =>
  [
    query.centerId ?? null,
    query.circleId ?? null,
    query.studentId ?? null,
    query.from ?? null,
    query.to ?? null,
    query.status ?? null,
    query.page ?? 1,
    query.pageSize ?? 20
  ] as const;

export const FOLLOW_UPS_QUERY_KEYS = {
  all: ["follow-ups"] as const,
  list: (query: FollowUpsListQuery) => [...FOLLOW_UPS_QUERY_KEYS.all, "list", ...listKey(query)] as const
};

export const useFollowUpsQuery = (query: FollowUpsListQuery, enabled = true) => {
  return useQuery({
    queryKey: FOLLOW_UPS_QUERY_KEYS.list(query),
    queryFn: () => followUpsApi.list(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 10_000
  });
};

const invalidateFollowUps = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: FOLLOW_UPS_QUERY_KEYS.all }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["reports"] })
  ]);
};

export const useCreateFollowUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFollowUpPayload) => followUpsApi.create(payload),
    onSuccess: async () => {
      await invalidateFollowUps(queryClient);
    }
  });
};

export const useUpdateFollowUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { followUpId: number; payload: UpdateFollowUpPayload }) =>
      followUpsApi.update(input.followUpId, input.payload),
    onSuccess: async () => {
      await invalidateFollowUps(queryClient);
    }
  });
};

export const useFinalizeFollowUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (followUpId: number) => followUpsApi.finalize(followUpId),
    onSuccess: async () => {
      await invalidateFollowUps(queryClient);
    }
  });
};
