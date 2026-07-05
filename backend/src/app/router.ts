import { Router } from "express";
import { env } from "../config/env";
import { healthRouter } from "./health";
import authRouter from "../modules/auth/auth.routes";
import orgRouter from "../modules/org/org.routes";
import usersRouter from "../modules/users/users.routes";
import dashboardRouter from "../modules/dashboard/dashboard.routes";
import attendanceRouter from "../modules/attendance/attendance.routes";
import examsRouter from "../modules/exams/exams.routes";
import gradeScalesRouter from "../modules/exams/grade-scales.routes";
import libraryRouter from "../modules/library/library.routes";
import mediaRouter from "../modules/media/media.routes";
import accountingRouter from "../modules/accounting/accounting.routes";
import financeV2Router from "../modules/finance-v2/finance-v2.routes";
import reportsRouter from "../modules/reports/reports.routes";
import notificationsRouter from "../modules/notifications/notifications.routes";
import followUpsRouter from "../modules/follow-ups/follow-ups.routes";
import quranRouter from "../modules/quran/quran.routes";
import auditRouter from "../modules/audit/audit.routes";
import systemRouter from "../modules/system/system.routes";
import metricsRouter from "../modules/system/metrics.routes";
import docsRouter from "../docs/docs.routes";
import supervisorNotesRouter from "../modules/supervisor-notes/supervisor-notes.routes";
import staffOpsRouter from "../modules/staff-operations/staff-operations.routes";
import attendancePolicyRouter from "../modules/staff-operations/attendance-policy.routes";
import staffLeaveRouter from "../modules/staff-operations/staff-leave.routes";
import staffScheduleRouter from "../modules/staff-operations/staff-schedule.routes";
import financeDeductionRouter from "../modules/finance-deductions/finance-deduction.routes";
import supervisorVisitRouter from "../modules/supervisor-visits/supervisor-visit.routes";
import goldenRecordsRouter from "../modules/golden-records/golden-records.routes";
import groupActivitiesRouter from "../modules/group-activities/group-activities.routes";
import monthlyPlansRouter from "../modules/monthly-plans/monthly-plans.routes";
import remoteRecitationRouter from "../modules/remote-recitation/remote-recitation.routes";
import publicCertificatesRouter from "../modules/certificates/certificates.public.routes";

const router = Router();

if (env.DOCS_ENABLED) {
  router.use(docsRouter);
}

if (env.METRICS_ENABLED) {
  router.use(metricsRouter);
}

router.use(healthRouter());

router.use(systemRouter);
router.use(publicCertificatesRouter);

router.use("/auth", authRouter);
router.use("/org", orgRouter);
router.use("/users", usersRouter);
router.use("/dashboard", dashboardRouter);
router.use(attendanceRouter);
router.use(examsRouter);
router.use("/grade-scales", gradeScalesRouter);
router.use(libraryRouter);
router.use(mediaRouter);
router.use(accountingRouter);
router.use(financeV2Router);
router.use(reportsRouter);
router.use(notificationsRouter);
router.use("/follow-ups", followUpsRouter);
router.use(quranRouter);
router.use(auditRouter);
router.use(supervisorNotesRouter);
router.use("/staff-operations", staffOpsRouter);
router.use("/staff-operations/leaves", staffLeaveRouter);
router.use("/staff-schedules", staffScheduleRouter);
router.use("/attendance-policy", attendancePolicyRouter);
router.use("/supervisor-visits", supervisorVisitRouter);
router.use("/finance-deductions", financeDeductionRouter);
router.use(goldenRecordsRouter);
router.use(groupActivitiesRouter);
router.use(monthlyPlansRouter);
router.use(remoteRecitationRouter);

export default router;
