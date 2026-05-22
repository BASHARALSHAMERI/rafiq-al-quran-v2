import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { goldenRecordsApi } from "./golden-records.api";
import type {
  CandidateDecisionPayload,
  LinkCandidateExamAttemptPayload,
  CandidateRequiredDecisionPayload,
  CandidatesQuery,
  CreateCandidatePayload,
  CreateGoldenRecordPayload,
  GoldenRecordDecisionPayload,
  GoldenRecordRequiredDecisionPayload,
  GoldenRecordsQuery,
  GoldenRecordStatsQuery,
  UpdateCandidatePayload,
  UpdateGoldenRecordPayload
} from "./types";

const candidateQueryKey = (query: CandidatesQuery) =>
  [
    query.centerId ?? null,
    query.circleId ?? null,
    query.search ?? null,
    query.year ?? null,
    query.status ?? null,
    query.page ?? null,
    query.pageSize ?? null
  ] as const;

const goldenRecordQueryKey = (query: GoldenRecordsQuery) =>
  [
    query.centerId ?? null,
    query.circleId ?? null,
    query.search ?? null,
    query.year ?? null,
    query.type ?? null,
    query.riwaya ?? null,
    query.status ?? null,
    query.page ?? null,
    query.pageSize ?? null
  ] as const;

const statsQueryKey = (query: GoldenRecordStatsQuery) =>
  [query.centerId ?? null, query.year ?? null] as const;

export const GOLDEN_RECORDS_QUERY_KEYS = {
  all: ["golden-records"] as const,
  candidates: (query: CandidatesQuery) =>
    [...GOLDEN_RECORDS_QUERY_KEYS.all, "candidates", ...candidateQueryKey(query)] as const,
  finalRecords: (query: GoldenRecordsQuery) =>
    [...GOLDEN_RECORDS_QUERY_KEYS.all, "final-records", ...goldenRecordQueryKey(query)] as const,
  stats: (query: GoldenRecordStatsQuery) =>
    [...GOLDEN_RECORDS_QUERY_KEYS.all, "stats", ...statsQueryKey(query)] as const
};

const invalidateGoldenRecords = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: GOLDEN_RECORDS_QUERY_KEYS.all });
};

export const useGraduationCandidatesQuery = (query: CandidatesQuery, enabled = true) => {
  return useQuery({
    queryKey: GOLDEN_RECORDS_QUERY_KEYS.candidates(query),
    queryFn: () => goldenRecordsApi.getCandidates(query),
    enabled,
    staleTime: 20_000
  });
};

export const useGoldenRecordsQuery = (query: GoldenRecordsQuery, enabled = true) => {
  return useQuery({
    queryKey: GOLDEN_RECORDS_QUERY_KEYS.finalRecords(query),
    queryFn: () => goldenRecordsApi.getGoldenRecords(query),
    enabled,
    staleTime: 20_000
  });
};

export const useGoldenRecordStatsQuery = (query: GoldenRecordStatsQuery, enabled = true) => {
  return useQuery({
    queryKey: GOLDEN_RECORDS_QUERY_KEYS.stats(query),
    queryFn: () => goldenRecordsApi.getStats(query),
    enabled,
    staleTime: 20_000
  });
};

export const useCreateCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCandidatePayload) => goldenRecordsApi.createCandidate(payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useUpdateCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { candidateId: number; payload: UpdateCandidatePayload }) =>
      goldenRecordsApi.updateCandidate(input.candidateId, input.payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useApproveCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { candidateId: number; payload: CandidateDecisionPayload }) =>
      goldenRecordsApi.approveCandidate(input.candidateId, input.payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useRejectCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { candidateId: number; payload: CandidateRequiredDecisionPayload }) =>
      goldenRecordsApi.rejectCandidate(input.candidateId, input.payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useDeferCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { candidateId: number; payload: CandidateRequiredDecisionPayload }) =>
      goldenRecordsApi.deferCandidate(input.candidateId, input.payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useLinkCandidateExamAttemptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { candidateId: number; payload: LinkCandidateExamAttemptPayload }) =>
      goldenRecordsApi.linkCandidateExamAttempt(input.candidateId, input.payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useCreateGoldenRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGoldenRecordPayload) => goldenRecordsApi.createGoldenRecord(payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useUpdateGoldenRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { recordId: number; payload: UpdateGoldenRecordPayload }) =>
      goldenRecordsApi.updateGoldenRecord(input.recordId, input.payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useSubmitGoldenRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { recordId: number; payload: GoldenRecordDecisionPayload }) =>
      goldenRecordsApi.submitGoldenRecord(input.recordId, input.payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useApproveGoldenRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { recordId: number; payload: GoldenRecordDecisionPayload }) =>
      goldenRecordsApi.approveGoldenRecord(input.recordId, input.payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};

export const useRejectGoldenRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { recordId: number; payload: GoldenRecordRequiredDecisionPayload }) =>
      goldenRecordsApi.rejectGoldenRecord(input.recordId, input.payload),
    onSuccess: async () => {
      await invalidateGoldenRecords(queryClient);
    }
  });
};
