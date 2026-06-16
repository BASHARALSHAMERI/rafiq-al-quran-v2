import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { reportsApi } from "./reports.api";
import type { ExportReportPayload, ReportsFilters, ReportType, ReportFilterDefinition } from "./types";

const reportsFiltersKey = (filters: ReportsFilters) => [
  filters.from,
  filters.to,
  filters.centerId ?? null,
  filters.circleId ?? null,
  filters.actorRole ?? null,
  filters.examStatus ?? null,
  filters.status ?? null,
  filters.search ?? null,
  filters.month ?? null,
  filters.year ?? null,
  filters.studentId ?? null
] as const;

export const REPORTS_QUERY_KEYS = {
  all: ["reports"] as const,
  catalog: () => [...REPORTS_QUERY_KEYS.all, "catalog"] as const,
  byType: (reportType: ReportType, filters: ReportsFilters) =>
    [...REPORTS_QUERY_KEYS.all, reportType, ...reportsFiltersKey(filters)] as const,
  studentReport: (studentId: number, filters: ReportsFilters) =>
    [...REPORTS_QUERY_KEYS.all, "student-report", studentId, ...reportsFiltersKey(filters)] as const
};

export const useReportsCatalogQuery = () => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.catalog(),
    queryFn: () => reportsApi.getCatalog(),
    staleTime: 60_000
  });
};

export const useReportQuery = (
  reportType: ReportType,
  filters: ReportsFilters,
  enabled: boolean
) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.byType(reportType, filters),
    queryFn: () => reportsApi.getReport(reportType, filters),
    enabled,
    staleTime: 20_000
  });
};



export const useStudentReportQuery = (
  studentId: number | null,
  filters: ReportsFilters,
  enabled: boolean
) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.studentReport(studentId ?? 0, filters),
    queryFn: () => reportsApi.getStudentReport(studentId ?? 0, filters),
    enabled: enabled && studentId !== null,
    staleTime: 60_000
  });
};


/** REPORTS-1: Summary report hooks */
export const useCentersSummaryQuery = (enabled = true) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.all, "summary", "centers"] as const,
    queryFn: () => reportsApi.getCentersSummary(),
    enabled,
    staleTime: 60_000
  });
};

export const useCirclesSummaryQuery = (centerId?: number, enabled = true) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.all, "summary", "circles", centerId ?? null] as const,
    queryFn: () => reportsApi.getCirclesSummary(centerId),
    enabled,
    staleTime: 60_000
  });
};

export const useStudentsSummaryQuery = (filters?: { centerId?: number; circleId?: number; activeOnly?: boolean }, enabled = true) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.all, "summary", "students", filters?.centerId ?? null, filters?.circleId ?? null, filters?.activeOnly ?? null] as const,
    queryFn: () => reportsApi.getStudentsSummary(filters),
    enabled,
    staleTime: 60_000
  });
};

export const useGoldenRecordsSummaryQuery = (centerId?: number, enabled = true) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.all, "summary", "golden-records", centerId ?? null] as const,
    queryFn: () => reportsApi.getGoldenRecordsSummary(centerId),
    enabled,
    staleTime: 60_000
  });
};

export const useExportReportMutation = () => {
  return useMutation({
    mutationFn: (payload: ExportReportPayload) => reportsApi.exportReport(payload)
  });
};

/**
 * Hook: يربط الفلاتر بـ URL query params
 * الاستخدام المباشر لقيم الفلتر وتحديثها في URL
 */
export function useReportUrlFilters(filterDefs: ReportFilterDefinition[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filterIds = useMemo(() => filterDefs.map((f) => f.id), [filterDefs]);

  const values = useMemo(() => {
    const result: Record<string, string | number | undefined> = {};
    for (const id of filterIds) {
      const val = searchParams.get(id);
      if (val != null && val !== "") result[id] = val;
    }
    return result;
  }, [searchParams, filterIds]);

  const activeCount = useMemo(() => {
    return filterIds.filter((id) => searchParams.has(id) && searchParams.get(id) !== "").length;
  }, [searchParams, filterIds]);

  const setFilter = useCallback(
    (filterId: string, value: string | number | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value == null || value === "" || value === "all") {
            next.delete(filterId);
          } else {
            next.set(filterId, String(value));
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const id of filterIds) next.delete(id);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams, filterIds]);

  return { values, setFilter, resetFilters, activeCount };
}
