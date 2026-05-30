import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgApi } from "./org.api";
import type {
  CreateCenterPayload,
  CreateCirclePayload,
  UpdateOrganizationBrandingPayload,
  UpdateCenterPayload,
  UpdateCirclePayload,
  UpdateEntityStatusPayload
} from "./types";

export const ORG_QUERY_KEYS = {
  all: ["org"] as const,
  branding: () => [...ORG_QUERY_KEYS.all, "branding"] as const,
  centers: () => [...ORG_QUERY_KEYS.all, "centers"] as const,
  circles: (centerId?: number) => [...ORG_QUERY_KEYS.all, "circles", centerId ?? null] as const
};

export const useOrgBrandingQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ORG_QUERY_KEYS.branding(),
    queryFn: () => orgApi.getBranding(),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });
};

export const useCentersQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ORG_QUERY_KEYS.centers(),
    queryFn: () => orgApi.getCenters(),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });
};

export const useCirclesQuery = (
  centerId?: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ORG_QUERY_KEYS.circles(centerId),
    queryFn: () => orgApi.getCircles({ centerId }),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });
};

export const useCreateCenterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCenterPayload) => orgApi.createCenter(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.all });
    }
  });
};

export const useUpdateCenterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { centerId: number; payload: UpdateCenterPayload }) =>
      orgApi.updateCenter(input.centerId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.all });
    }
  });
};

export const useUpdateCenterStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { centerId: number; payload: UpdateEntityStatusPayload }) =>
      orgApi.updateCenterStatus(input.centerId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.all });
    }
  });
};

export const useUpdateOrgBrandingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrganizationBrandingPayload) => orgApi.updateBranding(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.all });
    }
  });
};

export const useCreateCircleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCirclePayload) => orgApi.createCircle(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.all });
    }
  });
};

export const useUpdateCircleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { circleId: number; payload: UpdateCirclePayload }) =>
      orgApi.updateCircle(input.circleId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.all });
    }
  });
};

export const useUpdateCircleStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { circleId: number; payload: UpdateEntityStatusPayload }) =>
      orgApi.updateCircleStatus(input.circleId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.all });
    }
  });
};
