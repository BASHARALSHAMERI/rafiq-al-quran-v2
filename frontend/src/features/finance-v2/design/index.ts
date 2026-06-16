/**
 * FA-UX-5 — Finance Design System
 * Composable finance-scoped primitives built on top of shared UI components.
 */

export { FinancePageShell, type FinancePageShellProps } from "./FinancePageShell";
export { FinancePageHeader, type FinancePageHeaderProps } from "./FinancePageHeader";
export {
  FinanceToolbar,
  type FinanceToolbarProps,
  type FinanceDensity
} from "./FinanceToolbar";
export {
  FinanceKPIStrip,
  type FinanceKPIStripProps,
  type FinanceKPI,
  type FinanceKPITone
} from "./FinanceKPIStrip";
export {
  FinanceDataTable,
  FinanceTableFooter,
  financeActionsColumn,
  type FinanceDataTableProps,
  type FinanceTableFooterProps,
  type FinanceTableDensity,
  type FinanceDataTableColumn
} from "./FinanceDataTable";
export { FinanceMoney, type FinanceMoneyProps } from "./FinanceMoney";
export {
  FinanceStatusBadge,
  type FinanceStatusBadgeProps,
  type FinanceStatus
} from "./FinanceStatusBadge";
export {
  FinanceFormModal,
  FinanceFormSection,
  type FinanceFormModalProps
} from "./FinanceFormModal";
export {
  FinanceConfirmModal,
  type FinanceConfirmModalProps,
  type FinanceConfirmTone
} from "./FinanceConfirmModal";
export {
  FinanceEmptyState,
  type FinanceEmptyStateProps,
  type FinanceEmptyVariant
} from "./FinanceEmptyState";
export { FinanceCurrencySelect, type FinanceCurrencySelectProps } from "./FinanceCurrencySelect";

import "./tokens.css";
