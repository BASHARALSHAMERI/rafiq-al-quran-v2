export type CatalogEntryKind =
  | "report"
  | "inline-report"
  | "summary-report"
  | "external-route"
  | "operational-list"
  | "coming-soon";

export type CatalogSectionId =
  | "educational"
  | "financial-reports"
  | "audit-reports"
  | "operational-sheets"
  | "donors-reports"
  | "receipts-reports";

export type CatalogEntryStatus = "ready" | "needs-data" | "coming-soon";

export type CatalogEntryScope = "org" | "center" | "circle" | "student" | "finance";

export type CatalogEntryOutput = "screen" | "print" | "pdf" | "excel";

export type CatalogEntryVisibility = "all" | "super" | "center";

export type CatalogEntry = {
  id: string;
  kind: CatalogEntryKind;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  icon: string;
  status: CatalogEntryStatus;
  section: CatalogSectionId;
  scope: CatalogEntryScope;
  outputs: CatalogEntryOutput[];
  visibility: CatalogEntryVisibility;
  featured?: boolean;
  route?: string;
  reportType?: string;
  summaryKey?: string;
};

export type CatalogSection = {
  id: CatalogSectionId;
  nameAr: string;
  nameEn: string;
  entries: CatalogEntry[];
};
