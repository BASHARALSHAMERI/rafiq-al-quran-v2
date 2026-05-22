import type { ElementType } from "react";

export type FinanceTab =
  | "INVOICES"
  | "PAYMENTS"
  | "SUMMARY"
  | "VOUCHERS"
  | "TREASURY"
  | "PAYROLL"
  | "REWARDS"
  | "APPROVALS";

export type FinanceTabItem = {
  key: FinanceTab;
  label: string;
  icon: ElementType;
  order?: number;
  advanced?: boolean;
};
