export type CertificateKind = "EXAM" | "FULL_QURAN_COMPLETION" | "IJAZAH";

export type CertificateSignature = {
  role: string;
  name: string;
};

export type CertificateTemplateData = {
  kind: CertificateKind;
  associationName: string;
  associationLogoUrl: string | null;
  centerName: string;
  centerLogoUrl: string | null;
  certificateTitle: string;
  certificateSubtitle: string;
  studentName: string;
  circleName: string | null;
  examTitle: string | null;
  examCategory: string | null;
  rangeLabel: string | null;
  gradeLabel: string;
  examDate: string | null;
  completionDate: string | null;
  riwaya: string | null;
  certificateSerial: string;
  detailLine: string;
  verifyUrl?: string;
  qrCodeDataUrl?: string;
  signatures: [CertificateSignature, CertificateSignature, CertificateSignature];
};
