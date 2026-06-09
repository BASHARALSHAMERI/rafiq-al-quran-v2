import React, { Suspense, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "../components/guards/RequireAuth";
import RequireRole from "../components/guards/RequireRole";
import { useAuthStore } from "../features/auth/auth.store";
import ForbiddenPage from "../pages/ForbiddenPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import { commonFeedback } from "../shared/ui/feedback";
import AdminLayout from "./AdminLayout";
import { getRoleLandingPath } from "./role-landing";
import { ADMIN_ROUTES, type AdminRouteId } from "./route-meta";

// ─── Lazy-loaded pages (loaded on demand, not on initial bundle) ───
const DashboardPage = React.lazy(() => import("../pages/DashboardPage"));
const NotificationsPage = React.lazy(() => import("../pages/NotificationsPage"));
const CentersPage = React.lazy(() => import("../pages/CentersPage"));
const CirclesPage = React.lazy(() => import("../pages/CirclesPage"));
const StudentsPage = React.lazy(() => import("../pages/StudentsPage"));
const CenterAdminsPage = React.lazy(() => import("../pages/CenterAdminsPage"));
const TeachersPage = React.lazy(() => import("../pages/TeachersPage"));
const ParentsPage = React.lazy(() => import("../pages/ParentsPage"));
const SupervisorsPage = React.lazy(() => import("../pages/SupervisorsPage"));
const AccountantsPage = React.lazy(() => import("../pages/AccountantsPage"));
const StaffOperationsPage = React.lazy(() => import("../pages/StaffOperationsPage"));
const SelfAttendancePage = React.lazy(() => import("../pages/SelfAttendancePage"));
const ExamsPage = React.lazy(() => import("../pages/ExamsPage"));
const GoldenRecordsPage = React.lazy(() => import("../pages/GoldenRecordsPage"));
const LibraryPage = React.lazy(() => import("../pages/LibraryPage"));
const FinanceInvoicesPage = React.lazy(() => import("../pages/finance/FinanceInvoicesPage"));
const FinancePaymentsPage = React.lazy(() => import("../pages/finance/FinancePaymentsPage"));
const FinanceVouchersPage = React.lazy(() => import("../pages/finance/FinanceVouchersPage"));
const FinanceDonorsPage = React.lazy(() => import("../pages/finance/FinanceDonorsPage"));
const FinanceTreasuryPage = React.lazy(() => import("../pages/finance/FinanceTreasuryPage"));
const FinancePayrollPage = React.lazy(() => import("../pages/finance/FinancePayrollPage"));
const FinanceRewardsPage = React.lazy(() => import("../pages/finance/FinanceRewardsPage"));
const FinanceCurrenciesPage = React.lazy(() => import("../pages/finance/FinanceCurrenciesPage"));
const FinanceExpensesPage = React.lazy(() => import("../pages/finance/FinanceExpensesPage"));
const FinanceAssetsPage = React.lazy(() => import("../pages/finance/FinanceAssetsPage"));
const FinanceCenterFundingPage = React.lazy(() => import("../pages/finance/FinanceCenterFundingPage"));
const FinanceStatementOfFinancialPositionPage = React.lazy(() => import("../pages/finance/FinanceStatementOfFinancialPositionPage"));
const FinanceStatementOfActivitiesPage = React.lazy(() => import("../pages/finance/FinanceStatementOfActivitiesPage"));
const AccountingAccountsPage = React.lazy(() => import("../pages/accounting/AccountingAccountsPage"));
const AccountingJournalEntriesPage = React.lazy(() => import("../pages/accounting/AccountingJournalEntriesPage"));
const AccountingLedgerPage = React.lazy(() => import("../pages/accounting/AccountingLedgerPage"));
const AccountingTrialBalancePage = React.lazy(() => import("../pages/accounting/AccountingTrialBalancePage"));
const ReportsPage = React.lazy(() => import("../pages/ReportsPage"));
const AuditPage = React.lazy(() => import("../pages/AuditPage"));
const SettingsPage = React.lazy(() => import("../pages/SettingsPage"));
const ForgotPasswordPage = React.lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = React.lazy(() => import("../pages/ResetPasswordPage"));
const ActivateAccountPage = React.lazy(() => import("../pages/ActivateAccountPage"));

const RouteFallback = () => {
  const message =
    document.documentElement.lang === "en"
      ? commonFeedback.loadingPage.en
      : commonFeedback.loadingPage.ar;

  return (
    <main className="route-fallback">
      <div className="route-fallback__card">{message}</div>
    </main>
  );
};

const withRouteFallback = (element: ReactElement) => {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
};

const routeElements: Record<AdminRouteId, ReactElement> = {
  dashboard: <DashboardPage />,
  notifications: <NotificationsPage />,
  centers: <CentersPage />,
  circles: <CirclesPage />,
  students: <StudentsPage />,
  center_admins: <CenterAdminsPage />,
  teachers: <TeachersPage />,
  parents: <ParentsPage />,
  supervisors: <SupervisorsPage />,
  accountants: <AccountantsPage />,
  staff_attendance: <StaffOperationsPage />,
  self_attendance: <SelfAttendancePage />,
  exams: <ExamsPage />,
  graduation_candidates: <Navigate to="/golden-records?tab=candidates" replace />,
  golden_records: <GoldenRecordsPage />,
  library: <LibraryPage />,
  finance_dashboard: <Navigate to="/finance/invoices" replace />,
  finance_invoices: <FinanceInvoicesPage />,
  finance_payments: <FinancePaymentsPage />,
  finance_vouchers: <FinanceVouchersPage />,
  finance_donors: <FinanceDonorsPage />,
  finance_treasury: <FinanceTreasuryPage />,
  finance_payroll: <FinancePayrollPage />,
  finance_rewards: <FinanceRewardsPage />,
  finance_currencies: <FinanceCurrenciesPage />,
  finance_expenses: <FinanceExpensesPage />,
  finance_assets: <FinanceAssetsPage />,
  finance_center_funding: <FinanceCenterFundingPage />,
  finance_financial_position: <FinanceStatementOfFinancialPositionPage />,
  finance_statement_of_activities: <FinanceStatementOfActivitiesPage />,
  accounting_accounts: <AccountingAccountsPage />,
  accounting_journal_entries: <AccountingJournalEntriesPage />,
  accounting_ledger: <AccountingLedgerPage />,
  accounting_trial_balance: <AccountingTrialBalancePage />,
  finance_reports: <Navigate to="/reports" replace />,
  reports: <ReportsPage />,
  audit: <AuditPage />,
  settings: <SettingsPage />
};

function AuthLandingRedirect() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleLandingPath(user.role)} replace />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={withRouteFallback(<ForgotPasswordPage />)} />
        <Route path="/reset-password" element={withRouteFallback(<ResetPasswordPage />)} />
        <Route path="/activate" element={withRouteFallback(<ActivateAccountPage />)} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<AuthLandingRedirect />} />
          <Route
            path="/parent/home"
            element={<ForbiddenPage />}
          />
          <Route
            path="/student/home"
            element={<ForbiddenPage />}
          />

          <Route element={<AdminLayout />}>
          {/* FA-5.1: /finance → /finance/invoices (first operational page; dashboard hidden as duplicate) */}
          <Route path="/finance" element={<Navigate to="/finance/invoices" replace />} />
          {/* FA-5.4: /finance/reports → /reports (Legacy FinanceReportsPage deleted; using general reports) */}
          <Route path="/finance/reports" element={<Navigate to="/reports" replace />} />
            {ADMIN_ROUTES.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={withRouteFallback(
                  <RequireRole routeId={route.id}>{routeElements[route.id]}</RequireRole>
                )}
              />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
