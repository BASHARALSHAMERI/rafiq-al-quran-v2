import { lazy, Suspense, type ReactElement } from "react";
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

const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));
const CentersPage = lazy(() => import("../pages/CentersPage"));
const CirclesPage = lazy(() => import("../pages/CirclesPage"));
const StudentsPage = lazy(() => import("../pages/StudentsPage"));
const CenterAdminsPage = lazy(() => import("../pages/CenterAdminsPage"));
const TeachersPage = lazy(() => import("../pages/TeachersPage"));
const ParentsPage = lazy(() => import("../pages/ParentsPage"));
const SupervisorsPage = lazy(() => import("../pages/SupervisorsPage"));
const StaffOperationsPage = lazy(() => import("../pages/StaffOperationsPage"));
const ExamsPage = lazy(() => import("../pages/ExamsPage"));
const GoldenRecordsPage = lazy(() => import("../pages/GoldenRecordsPage"));
const LibraryPage = lazy(() => import("../pages/LibraryPage"));
const FinanceInvoicesPage = lazy(() => import("../pages/finance/FinanceInvoicesPage"));
const FinancePaymentsPage = lazy(() => import("../pages/finance/FinancePaymentsPage"));
const FinanceVouchersPage = lazy(() => import("../pages/finance/FinanceVouchersPage"));
const FinanceDonorsPage = lazy(() => import("../pages/finance/FinanceDonorsPage"));
const FinanceTreasuryPage = lazy(() => import("../pages/finance/FinanceTreasuryPage"));
const FinancePayrollPage = lazy(() => import("../pages/finance/FinancePayrollPage"));
const FinanceRewardsPage = lazy(() => import("../pages/finance/FinanceRewardsPage"));
const FinanceCurrenciesPage = lazy(() => import("../pages/finance/FinanceCurrenciesPage"));
const FinanceExpensesPage = lazy(() => import("../pages/finance/FinanceExpensesPage"));
const FinanceAssetsPage = lazy(() => import("../pages/finance/FinanceAssetsPage"));
const FinanceCenterFundingPage = lazy(() => import("../pages/finance/FinanceCenterFundingPage"));
const FinanceStatementOfFinancialPositionPage = lazy(() => import("../pages/finance/FinanceStatementOfFinancialPositionPage"));
const FinanceStatementOfActivitiesPage = lazy(() => import("../pages/finance/FinanceStatementOfActivitiesPage"));
const AccountingAccountsPage = lazy(() => import("../pages/accounting/AccountingAccountsPage"));
const AccountingJournalEntriesPage = lazy(() => import("../pages/accounting/AccountingJournalEntriesPage"));
const AccountingLedgerPage = lazy(() => import("../pages/accounting/AccountingLedgerPage"));
const AccountingTrialBalancePage = lazy(() => import("../pages/accounting/AccountingTrialBalancePage"));
const ReportsPage = lazy(() => import("../pages/ReportsPage"));
const AuditPage = lazy(() => import("../pages/AuditPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const RoleLandingPage = lazy(() => import("../pages/RoleLandingPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));
const ActivateAccountPage = lazy(() => import("../pages/ActivateAccountPage"));

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
  staff_attendance: <StaffOperationsPage />,
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
            element={withRouteFallback(
              <RequireRole allowedRoles={["PARENT"]}>
                <RoleLandingPage />
              </RequireRole>
            )}
          />
          <Route
            path="/student/home"
            element={withRouteFallback(
              <RequireRole allowedRoles={["STUDENT"]}>
                <RoleLandingPage />
              </RequireRole>
            )}
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
