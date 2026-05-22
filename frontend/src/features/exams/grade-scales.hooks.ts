import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gradeScalesApi } from "./grade-scales.api";
import type { CreateGradeScalePayload, UpdateGradeScalePayload } from "./types";

export const GRADE_SCALES_QUERY_KEYS = {
  all: ["gradeScales"] as const,
  active: ["gradeScales", "active"] as const
};

export function useGradeScalesQuery() {
  return useQuery({
    queryKey: GRADE_SCALES_QUERY_KEYS.all,
    queryFn: () => gradeScalesApi.getAll()
  });
}

export function useActiveGradeScalesQuery() {
  return useQuery({
    queryKey: GRADE_SCALES_QUERY_KEYS.active,
    queryFn: () => gradeScalesApi.getActive()
  });
}

export function useCreateGradeScaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGradeScalePayload) => gradeScalesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRADE_SCALES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GRADE_SCALES_QUERY_KEYS.active });
    }
  });
}

export function useUpdateGradeScaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateGradeScalePayload }) =>
      gradeScalesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRADE_SCALES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GRADE_SCALES_QUERY_KEYS.active });
    }
  });
}

export function useDeleteGradeScaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => gradeScalesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRADE_SCALES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GRADE_SCALES_QUERY_KEYS.active });
    }
  });
}
