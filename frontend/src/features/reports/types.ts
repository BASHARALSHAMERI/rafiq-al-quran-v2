export type ReportType = "ATTENDANCE" | "FOLLOW_UP" | "EXAMS" | "FINANCE";
export type ReportFormat = "PDF" | "XLSX";
export type ReportRunStatus = "PENDING" | "COMPLETED" | "FAILED";

export type ReportsCatalogItem = {
  reportType: ReportType;
  title: string;
  formats: ReportFormat[];
  filters: string[];
};

export type ReportsFilters = {
  from: string;
  to: string;
  centerId?: number;
  circleId?: number;
  actorRole?: string;
  examStatus?: string;
  status?: "PENDING" | "PARTIAL" | "PAID";
  search?: string;
  month?: number;
  year?: number;
  studentId?: number;
};

export type SupervisorDashboardPayload = {
  overallStats: {
    totalStudents: number;
    avgAttendance: number;
    attendanceTrend: "up" | "down" | "stable";
    totalHifzPages: number;
    avgPlanCompletion: number;
    strugglingStudents: number;
    avgRating: number;
    ratingTrend: "up" | "down" | "stable";
  };
  halaqat: Array<{
    id: string;
    name: string;
    teacher: string;
    students: number;
    trend: "up" | "down";
    avgAttendance: number;
    avgHifz: number;
    avgReview: number;
    avgRating: number;
  }>;
  strugglingStudents: Array<{
    id: string;
    name: string;
    halqa: string;
    hifzPercent: number;
    attendance: number;
    reason: string;
  }>;
};

export type CircleReportPayload = {
  circle: {
    id: number;
    centerId: number;
    name: string;
    teacherName: string | null;
    totalStudents: number;
  };
  summary: {
    overallGrade: string;
    completionRate: number;
    attendanceRate: number;
    averageRating: number;
    memorizationPages: number;
    reviewPages: number;
    totalStudents: number;
    activitiesCount: number;
    bestStudent: any;
    mostImproved: any;
  };
  students: Array<{
    id: number;
    name: string;
    level: string | null;
    attendanceRate: number;
    hifzPages: number;
    reviewPages: number;
    averageRating: number;
    achievementScore: number;
    lastMemorized: string | null;
  }>;
};

export type StudentReportPayload = {
  student: {
    id: number;
    fullName: string;
    role: string;
  };
  period: {
    month: number;
    year: number;
    from: string;
    to: string;
  };
  kpis: {
    attendance: {
      present: number;
      absent: number;
      late: number;
      excused: number;
      rate: number;
    };
    followUp: {
      memorizationPages: number;
      reviewPages: number;
      averageRating: number;
    };
    exams: {
      total: number;
      passed: number;
      averageScore: number;
    };
    overallCompletionRate: number;
    monthlyGrade: string;
  };
  attendance: any[];
  followUps: any[];
  activities: any[];
};

export type ReportsPayload = {
  kpis: Record<string, unknown>;
  rows: Array<Record<string, unknown>>;
  meta: {
    from: string;
    to: string;
    reportType: ReportType;
    scope: {
      centerIds?: number[];
      circleIds?: number[];
      studentIds?: number[];
    };
  };
};

export type ExportReportPayload = {
  reportType: ReportType;
  format: ReportFormat;
  filters: ReportsFilters;
};

export type ExportReportResponse = {
  runId: number;
  fileId: number;
  status: ReportRunStatus | "COMPLETED";
  downloadUrl: string;
};
