-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."BookCategory" AS ENUM ('TAFSIR', 'FIQH', 'HADITH', 'MATN', 'SIRA', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'CENTER_ADMIN', 'SUPERVISOR', 'TEACHER', 'PARENT', 'STUDENT');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "public"."AttendanceSource" AS ENUM ('MANUAL', 'SELF_CHECK_IN', 'SYSTEM', 'IMPORT');

-- CreateEnum
CREATE TYPE "public"."StaffRoleType" AS ENUM ('TEACHER', 'CENTER_ADMIN', 'SUPERVISOR', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('MEDICAL', 'OFFICIAL', 'PERSONAL', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."LeaveRequestStatus" AS ENUM ('LEAVE_PENDING', 'LEAVE_APPROVED', 'LEAVE_REJECTED');

-- CreateEnum
CREATE TYPE "public"."ScheduleSourceType" AS ENUM ('CIRCLE_SYNC', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."VisitPlanStatus" AS ENUM ('VISIT_PLAN_DRAFT', 'VISIT_PLAN_ACTIVE', 'VISIT_PLAN_COMPLETED');

-- CreateEnum
CREATE TYPE "public"."VisitPlanItemStatus" AS ENUM ('VISIT_ITEM_PENDING', 'VISIT_ITEM_COMPLETED', 'VISIT_ITEM_MISSED');

-- CreateEnum
CREATE TYPE "public"."VisitPriority" AS ENUM ('NORMAL', 'HIGH', 'URGENT', 'LOW');

-- CreateEnum
CREATE TYPE "public"."DeductionTriggerType" AS ENUM ('UNEXCUSED_ABSENCE', 'LATE_THRESHOLD', 'EARLY_DEPARTURE', 'UNPAID_LEAVE', 'MISSED_VISIT');

-- CreateEnum
CREATE TYPE "public"."DeductionCalcType" AS ENUM ('FIXED', 'PER_DAY', 'PER_OCCURRENCE');

-- CreateEnum
CREATE TYPE "public"."DeductionEventStatus" AS ENUM ('DEDUCTION_PENDING', 'DEDUCTION_APPROVED', 'DEDUCTION_REJECTED', 'DEDUCTION_WAIVED', 'DEDUCTION_INCLUDED_IN_PAYROLL');

-- CreateEnum
CREATE TYPE "public"."GeoState" AS ENUM ('INSIDE', 'OUTSIDE', 'NOT_SENT');

-- CreateEnum
CREATE TYPE "public"."GeoEnforcement" AS ENUM ('DISABLED', 'WARN_ONLY', 'STRICT');

-- CreateEnum
CREATE TYPE "public"."ParentRelationType" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "public"."ParentProfileRelationType" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."KhatmType" AS ENUM ('HAFIZ', 'KHATEM', 'IJAZAH', 'QIRAAT');

-- CreateEnum
CREATE TYPE "public"."RiwayaType" AS ENUM ('HAFS', 'WARSH');

-- CreateEnum
CREATE TYPE "public"."GraduationCandidateStatus" AS ENUM ('NOMINATED', 'SCHEDULED', 'TESTED', 'APPROVED', 'REJECTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "public"."GoldenRecordStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."GoldenRecordType" AS ENUM ('KHATEM', 'IJAZAH');

-- CreateEnum
CREATE TYPE "public"."GoldenRecordSource" AS ENUM ('CANDIDATE', 'MANUAL', 'EXAM_BASED');

-- CreateEnum
CREATE TYPE "public"."AchievementCategory" AS ENUM ('LESS_THAN_10_JUZ', 'JUZ_10', 'JUZ_20', 'JUZ_30');

-- CreateEnum
CREATE TYPE "public"."EmploymentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "public"."SupervisorProfileStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."SalarySource" AS ENUM ('GRADE', 'OVERRIDE');

-- CreateEnum
CREATE TYPE "public"."StaffAssignmentType" AS ENUM ('CENTER_ADMIN', 'CENTER_SUPERVISOR', 'CIRCLE_TEACHER', 'CIRCLE_SUPERVISOR', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "public"."StudentLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "public"."StudentProfileStatus" AS ENUM ('REGULAR', 'DROPPED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('LOGIN', 'REFRESH_TOKEN', 'LOGOUT', 'ATTENDANCE_MARKED', 'ATTENDANCE_UPDATED', 'STUDENT_ENROLLED', 'USER_CREATED', 'GENERIC', 'FOLLOW_UP_RECORDED');

-- CreateEnum
CREATE TYPE "public"."FollowUpType" AS ENUM ('NEW_MEMORIZATION', 'REVIEW', 'MATN');

-- CreateEnum
CREATE TYPE "public"."FollowUpRecordStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "public"."MatnProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED');

-- CreateEnum
CREATE TYPE "public"."CorrectionTargetType" AS ENUM ('ATTENDANCE', 'FOLLOW_UP', 'EXAM_ATTEMPT');

-- CreateEnum
CREATE TYPE "public"."CorrectionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ExamType" AS ENUM ('JUZ', 'FULL_QURAN', 'SURAH_RANGE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExamPurpose" AS ENUM ('NORMAL', 'MONTHLY', 'LEVEL', 'GOLDEN_RECORD_MUSHAF');

-- CreateEnum
CREATE TYPE "public"."ExamQuestionSource" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "public"."NominationRequestStatus" AS ENUM ('SUBMITTED', 'RETURNED', 'REJECTED', 'DEFERRED', 'SUPERVISOR_APPROVED', 'CENTER_APPROVED');

-- CreateEnum
CREATE TYPE "public"."CommitteeRole" AS ENUM ('CHAIR', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."AttemptStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'EVALUATED', 'APPROVED', 'PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."LibraryVisibility" AS ENUM ('ORG', 'CENTER', 'CIRCLE');

-- CreateEnum
CREATE TYPE "public"."LibraryItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."LibraryItemType" AS ENUM ('DOCUMENT', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."TuitionAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'TRANSFER');

-- CreateEnum
CREATE TYPE "public"."DonorType" AS ENUM ('CHARITY_FOUNDATION', 'CHARITY_ASSOCIATION', 'INDIVIDUAL_DONOR', 'MERCHANT', 'PARENT_DONOR', 'GOVERNMENT_ENTITY', 'CORPORATE_SPONSOR');

-- CreateEnum
CREATE TYPE "public"."DonationStatus" AS ENUM ('PLEDGED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."FinanceAccountType" AS ENUM ('ORG_FUND', 'CENTER_FUND', 'ORG_BANK', 'CENTER_BANK');

-- CreateEnum
CREATE TYPE "public"."VoucherType" AS ENUM ('RECEIPT', 'DISBURSEMENT');

-- CreateEnum
CREATE TYPE "public"."VoucherSourceType" AS ENUM ('PAYMENT', 'PAYROLL_ITEM', 'REWARD_ITEM', 'FUND_TRANSFER', 'MANUAL', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."VoucherStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'POSTED', 'VOID_REQUESTED', 'VOIDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."VoucherAccountingCategory" AS ENUM ('DONATION', 'STUDENT_CONTRIBUTION', 'OTHER_INCOME', 'OPERATING_EXPENSE', 'EDUCATIONAL_EXPENSE', 'CENTER_EXPENSE', 'REWARD', 'PAYROLL');

-- CreateEnum
CREATE TYPE "public"."FinanceMovementType" AS ENUM ('PAYMENT_COLLECTION', 'VOUCHER_DISBURSEMENT', 'FUND_TRANSFER_OUT', 'FUND_TRANSFER_IN', 'PAYROLL_PAYOUT', 'REWARD_PAYOUT', 'VOID_REVERSAL', 'LEGACY_BACKFILL');

-- CreateEnum
CREATE TYPE "public"."FinanceMovementDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "public"."AccountingAccountType" AS ENUM ('ASSET', 'LIABILITY', 'NET_ASSET', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."AccountingNormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "public"."JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "public"."JournalSourceType" AS ENUM ('INVOICE', 'PAYMENT', 'VOUCHER', 'FUND_TRANSFER', 'MANUAL', 'PAYROLL', 'REWARD', 'DEDUCTION', 'EXPENSE_INVOICE', 'EXPENSE_PAYMENT', 'ASSET_ACQUISITION', 'ASSET_DEPRECIATION');

-- CreateEnum
CREATE TYPE "public"."FundTransferStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."FeeMode" AS ENUM ('FREE', 'SYMBOLIC_ONE_TIME', 'PLAN_MONTHLY');

-- CreateEnum
CREATE TYPE "public"."InvoiceType" AS ENUM ('TUITION_MONTHLY', 'REGISTRATION_ONE_TIME', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TuitionPlanKind" AS ENUM ('MONTHLY', 'ONE_TIME_REGISTRATION');

-- CreateEnum
CREATE TYPE "public"."PayrollBatchStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'PARTIALLY_PAID', 'PAID', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PayrollItemStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."RewardCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "public"."RewardType" AS ENUM ('GENERAL', 'PERFORMANCE', 'ATTENDANCE', 'COMPETITION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RewardBatchStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'PARTIALLY_PAID', 'PAID', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RewardItemStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."RewardBeneficiaryRole" AS ENUM ('TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('ATTENDANCE', 'FOLLOW_UP', 'EXAMS', 'FINANCE');

-- CreateEnum
CREATE TYPE "public"."ReportRunStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ReportFileKind" AS ENUM ('PDF', 'XLSX');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('EXAM_PUBLISHED', 'EXAM_ATTEMPT_SCHEDULED', 'GOLDEN_RECORD_NOMINATION_APPROVED', 'REMOTE_RECITATION_REQUESTED', 'REMOTE_RECITATION_APPROVED', 'REMOTE_RECITATION_REJECTED', 'REMOTE_RECITATION_CANCELLED', 'REMOTE_RECITATION_COMPLETED', 'LIBRARY_UPLOADED', 'INVOICE_ISSUED', 'PAYMENT_RECORDED', 'REPORT_EXPORTED', 'EXAM_SCORED', 'EXAM_RESULT_SHARED', 'VOUCHER_SUBMITTED', 'VOUCHER_APPROVED', 'PAYROLL_APPROVED', 'REWARD_APPROVED', 'TRANSFER_APPROVED', 'SUPERVISOR_VISIT_ASSIGNED', 'STAFF_SHIFT_REMINDER', 'STAFF_LATE_ALERT');

-- CreateEnum
CREATE TYPE "public"."AuditEntityType" AS ENUM ('USER', 'CENTER', 'CIRCLE', 'REMOTE_RECITATION_SLOT', 'REMOTE_RECITATION_BOOKING', 'EXAM', 'EXAM_ATTEMPT', 'LIBRARY_ITEM', 'INVOICE', 'PAYMENT', 'REPORT_EXPORT', 'SETTINGS', 'VOUCHER', 'FINANCE_ACCOUNT', 'FUND_TRANSFER', 'PAYROLL_BATCH', 'PAYROLL_ITEM', 'REWARD_BATCH', 'REWARD_ITEM', 'EXPENSE_INVOICE', 'FIXED_ASSET');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'ARCHIVE', 'DOWNLOAD', 'EXPORT', 'SCORE', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "public"."RemoteRecitationBookingStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."SupervisorNoteCategory" AS ENUM ('GENERAL', 'PRAISE', 'WARNING', 'VISIT', 'EVALUATION');

-- CreateEnum
CREATE TYPE "public"."SupervisorNoteStatus" AS ENUM ('PENDING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."CircleType" AS ENUM ('HIFZ', 'REVIEW', 'HIFZ_REVIEW');

-- CreateEnum
CREATE TYPE "public"."Weekday" AS ENUM ('FRIDAY', 'SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY');

-- CreateEnum
CREATE TYPE "public"."CircleScheduleMode" AS ENUM ('CLOCK', 'PRAYER');

-- CreateEnum
CREATE TYPE "public"."PrayerName" AS ENUM ('FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA');

-- CreateEnum
CREATE TYPE "public"."ExcuseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."MonthlyPlanStatus" AS ENUM ('PENDING', 'APPROVED', 'MODIFIED');

-- CreateEnum
CREATE TYPE "public"."GroupActivityType" AS ENUM ('LECTURE', 'TAFSEER', 'SEERAH', 'FIQH', 'TAJWEED', 'HADITH', 'EDUCATIONAL');

-- CreateEnum
CREATE TYPE "public"."FiscalPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ExpenseInvoiceStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."FixedAssetStatus" AS ENUM ('ACTIVE', 'UNDER_MAINTENANCE', 'DISPOSED', 'LOST', 'INACTIVE');

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logo_url" VARCHAR(500),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."centers" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name_ar" VARCHAR(120) NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL DEFAULT 'MALE',
    "center_admin_user_id" INTEGER NOT NULL,
    "logo_url" VARCHAR(500),
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh',
    "mosque_name" VARCHAR(255),
    "allowed_radius_meters" INTEGER DEFAULT 500,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "location_text" VARCHAR(255),

    CONSTRAINT "centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."circles" (
    "id" SERIAL NOT NULL,
    "centerId" INTEGER NOT NULL,
    "name_ar" VARCHAR(120) NOT NULL,
    "primary_teacher_user_id" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL DEFAULT 'MALE',
    "circle_type" "public"."CircleType" NOT NULL DEFAULT 'HIFZ',
    "mosque_name" VARCHAR(255),
    "location_text" VARCHAR(255),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "allowed_radius_meters" INTEGER,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."circle_schedule_slots" (
    "id" SERIAL NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "day_of_week" "public"."Weekday" NOT NULL,
    "mode" "public"."CircleScheduleMode" NOT NULL,
    "from_time" VARCHAR(5),
    "to_time" VARCHAR(5),
    "from_prayer" "public"."PrayerName",
    "to_prayer" "public"."PrayerName",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circle_schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."remote_recitation_settings" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "booking_lead_hours" INTEGER NOT NULL DEFAULT 2,
    "cancellation_window_hours" INTEGER NOT NULL DEFAULT 2,
    "max_advance_days" INTEGER NOT NULL DEFAULT 21,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_recitation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."remote_recitation_slots" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "join_url" VARCHAR(500) NOT NULL,
    "provider_host" VARCHAR(120),
    "note" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "remote_recitation_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."remote_recitation_bookings" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "slot_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "status" "public"."RemoteRecitationBookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "review_note" VARCHAR(500),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" VARCHAR(500),
    "completed_at" TIMESTAMP(3),
    "follow_up_record_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "remote_recitation_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "role" "public"."Role" NOT NULL,
    "passwordHash" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" INTEGER,
    "lastLoginAt" TIMESTAMP(3),
    "username" VARCHAR(80),
    "account_status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "activated_at" TIMESTAMP(3),
    "activation_sent_at" TIMESTAMP(3),
    "activation_token_expires_at" TIMESTAMP(3),
    "activation_token_hash" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "userId" INTEGER NOT NULL,
    "fullName" VARCHAR(160) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "birthDate" DATE,
    "phone" VARCHAR(32),
    "address" VARCHAR(255),
    "avatarUrl" VARCHAR(500),
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phone_normalized" VARCHAR(32),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."teacher_profiles" (
    "userId" INTEGER NOT NULL,
    "hireDate" DATE,
    "khatmType" "public"."KhatmType",
    "riwaya" "public"."RiwayaType",
    "educationLevel" VARCHAR(120),
    "yearsExperience" INTEGER,
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."supervisor_profiles" (
    "userId" INTEGER NOT NULL,
    "assignedAt" DATE,
    "status" "public"."SupervisorProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "educationLevel" VARCHAR(120),
    "yearsExperience" INTEGER,
    "quranQualification" "public"."KhatmType",
    "professionalNotes" VARCHAR(500),
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."center_admin_profiles" (
    "userId" INTEGER NOT NULL,
    "assignedAt" DATE,
    "employmentStatus" "public"."EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "educationLevel" VARCHAR(120),
    "yearsExperience" INTEGER,
    "administrativeExperienceYears" INTEGER,
    "professionalNotes" VARCHAR(500),
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "center_admin_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."student_profiles" (
    "userId" INTEGER NOT NULL,
    "nickname" VARCHAR(80),
    "level" "public"."StudentLevel" NOT NULL DEFAULT 'BEGINNER',
    "studentStatus" "public"."StudentProfileStatus" NOT NULL DEFAULT 'REGULAR',
    "joinDate" DATE,
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "current_juzz" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."parent_profiles" (
    "userId" INTEGER NOT NULL,
    "relationType" "public"."ParentProfileRelationType",
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."center_supervisors" (
    "id" SERIAL NOT NULL,
    "centerId" INTEGER NOT NULL,
    "supervisor_user_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "center_supervisors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_center_accesses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_center_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_circle_accesses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_circle_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_circle_enrollments" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "student_circle_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parent_student_links" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "relationType" "public"."ParentRelationType" NOT NULL DEFAULT 'GUARDIAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" INTEGER,

    CONSTRAINT "parent_student_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "markedById" INTEGER NOT NULL,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_attendance_records" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "attendance_date" DATE NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "marked_by_id" INTEGER,
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "early_departure_minutes" INTEGER,
    "late_minutes" INTEGER,
    "source" "public"."AttendanceSource" NOT NULL DEFAULT 'MANUAL',
    "staff_role" "public"."StaffRoleType" NOT NULL DEFAULT 'TEACHER',

    CONSTRAINT "staff_attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_excuse_requests" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "absence_date" DATE NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "status" "public"."ExcuseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "handled_by_id" INTEGER,
    "handled_at" TIMESTAMP(3),
    "response_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_excuse_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_policies" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "grace_period_minutes" INTEGER NOT NULL DEFAULT 15,
    "auto_absence_delay_minutes" INTEGER NOT NULL DEFAULT 60,
    "weekend_days" JSONB NOT NULL DEFAULT '["FRIDAY", "SATURDAY"]',
    "holidays" JSONB NOT NULL DEFAULT '[]',
    "geo_enforcement" "public"."GeoEnforcement" NOT NULL DEFAULT 'WARN_ONLY',
    "default_shift_duration_minutes" INTEGER NOT NULL DEFAULT 480,
    "early_departure_threshold_minutes" INTEGER NOT NULL DEFAULT 15,
    "prayer_api_source" VARCHAR(120) NOT NULL DEFAULT 'ALADHAN',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_schedule_assignments" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "staff_role" "public"."StaffRoleType" NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "source_type" "public"."ScheduleSourceType" NOT NULL DEFAULT 'MANUAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_schedule_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_schedule_slots" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "day_of_week" "public"."Weekday" NOT NULL,
    "mode" "public"."CircleScheduleMode" NOT NULL,
    "from_time" VARCHAR(5),
    "to_time" VARCHAR(5),
    "from_prayer" "public"."PrayerName",
    "to_prayer" "public"."PrayerName",
    "from_prayer_offset_minutes" INTEGER NOT NULL DEFAULT 0,
    "to_prayer_offset_minutes" INTEGER NOT NULL DEFAULT 0,
    "default_duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_leave_requests" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "leave_type" "public"."LeaveType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" INTEGER NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "attachment_url" VARCHAR(500),
    "status" "public"."LeaveRequestStatus" NOT NULL DEFAULT 'LEAVE_PENDING',
    "handled_by_id" INTEGER,
    "handled_at" TIMESTAMP(3),
    "response_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supervisor_visit_plans" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "supervisor_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "public"."VisitPlanStatus" NOT NULL DEFAULT 'VISIT_PLAN_DRAFT',
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_visit_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supervisor_visit_plan_items" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "planned_date" DATE NOT NULL,
    "planned_time_window" VARCHAR(100),
    "priority" "public"."VisitPriority" NOT NULL DEFAULT 'NORMAL',
    "notes" VARCHAR(500),
    "status" "public"."VisitPlanItemStatus" NOT NULL DEFAULT 'VISIT_ITEM_PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_visit_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supervisor_visit_logs" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "plan_item_id" INTEGER,
    "supervisor_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "start_latitude" DECIMAL(10,7),
    "start_longitude" DECIMAL(10,7),
    "start_geo_state" "public"."GeoState" NOT NULL DEFAULT 'NOT_SENT',
    "start_distance_meters" INTEGER,
    "end_latitude" DECIMAL(10,7),
    "end_longitude" DECIMAL(10,7),
    "end_geo_state" "public"."GeoState" NOT NULL DEFAULT 'NOT_SENT',
    "end_distance_meters" INTEGER,
    "checklist" JSONB,
    "rating" INTEGER,
    "observations" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_visit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_deduction_rules" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "trigger_type" "public"."DeductionTriggerType" NOT NULL,
    "threshold_count" INTEGER,
    "deduction_amount_sar" DECIMAL(10,2) NOT NULL,
    "deduction_type" "public"."DeductionCalcType" NOT NULL DEFAULT 'FIXED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_deduction_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_deduction_events" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "trigger_type" "public"."DeductionTriggerType" NOT NULL,
    "occurrence_count" INTEGER NOT NULL DEFAULT 1,
    "calculated_amount_sar" DECIMAL(10,2) NOT NULL,
    "status" "public"."DeductionEventStatus" NOT NULL DEFAULT 'DEDUCTION_PENDING',
    "payroll_batch_id" INTEGER,
    "reviewed_by_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "review_note" VARCHAR(500),
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_deduction_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prayer_time_cache" (
    "center_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "fajr" VARCHAR(5) NOT NULL,
    "dhuhr" VARCHAR(5) NOT NULL,
    "asr" VARCHAR(5) NOT NULL,
    "maghrib" VARCHAR(5) NOT NULL,
    "isha" VARCHAR(5) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_time_cache_pkey" PRIMARY KEY ("center_id","date")
);

-- CreateTable
CREATE TABLE "public"."follow_up_records" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "record_date" DATE NOT NULL,
    "type" "public"."FollowUpType" NOT NULL,
    "surah" VARCHAR(120),
    "from_ayah" INTEGER,
    "to_ayah" INTEGER,
    "pages_count" DECIMAL(5,1),
    "rating" INTEGER,
    "matn_name" VARCHAR(120),
    "matn_status" VARCHAR(50),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."FollowUpRecordStatus" NOT NULL DEFAULT 'FINAL',
    "finalized_at" TIMESTAMP(3),
    "from_surah" INTEGER,
    "to_surah" INTEGER,
    "ayah_count" INTEGER,
    "from_page" INTEGER,
    "to_page" INTEGER,
    "matn_id" INTEGER,
    "matn_from_ref" VARCHAR(80),
    "matn_to_ref" VARCHAR(80),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "follow_up_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matn_catalogs" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER,
    "code" VARCHAR(80) NOT NULL,
    "title_ar" VARCHAR(160) NOT NULL,
    "title_en" VARCHAR(160),
    "category" VARCHAR(80) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matn_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supervisor_notes" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "supervisor_id" INTEGER NOT NULL,
    "category" "public"."SupervisorNoteCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "public"."SupervisorNoteStatus" NOT NULL DEFAULT 'PENDING',
    "target_label" VARCHAR(255),
    "content" TEXT NOT NULL,
    "scores" JSONB,
    "visit_checklist" JSONB,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."correction_requests" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "target_type" "public"."CorrectionTargetType" NOT NULL,
    "target_id" INTEGER NOT NULL,
    "requested_by_id" INTEGER NOT NULL,
    "requested_by_role" "public"."Role" NOT NULL,
    "reason" TEXT NOT NULL,
    "proposed_changes" JSONB NOT NULL,
    "current_snapshot" JSONB NOT NULL,
    "status" "public"."CorrectionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" INTEGER,
    "review_note" VARCHAR(500),
    "reviewed_at" TIMESTAMP(3),
    "applied_by_id" INTEGER,
    "applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quran_ayah_index" (
    "id" SERIAL NOT NULL,
    "surah_number" INTEGER NOT NULL,
    "ayah_number" INTEGER NOT NULL,
    "page_number" INTEGER NOT NULL,
    "juz_number" INTEGER NOT NULL,
    "hizb_quarter" INTEGER,
    "provider" VARCHAR(120) NOT NULL,
    "provider_version" VARCHAR(120),
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quran_ayah_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "userAgent" VARCHAR(255),
    "ipAddress" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "user_agent" VARCHAR(255),
    "ip_address" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "activityType" "public"."ActivityType" NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" INTEGER,
    "message" VARCHAR(255) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exams" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER,
    "circle_id" INTEGER,
    "title" VARCHAR(160) NOT NULL,
    "type" "public"."ExamType" NOT NULL,
    "exam_branch" VARCHAR(120),
    "purpose" "public"."ExamPurpose" NOT NULL DEFAULT 'NORMAL',
    "max_score" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "pass_score" DOUBLE PRECISION NOT NULL,
    "status" "public"."ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_criteria" (
    "id" SERIAL NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "memorization_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tajweed_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performance_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prompting_penalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reminding_penalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tajweed_penalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "theoretical_tajweed_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min_question_count" INTEGER NOT NULL DEFAULT 1,
    "default_question_count" INTEGER NOT NULL DEFAULT 5,
    "max_question_count" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "exam_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_nomination_requests" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "proposed_exam_date" DATE,
    "teacher_notes" VARCHAR(2000),
    "readiness_score" INTEGER,
    "status" "public"."NominationRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "supervisor_review_notes" VARCHAR(2000),
    "supervisor_reviewed_by_id" INTEGER,
    "supervisor_reviewed_at" TIMESTAMP(3),
    "center_approval_notes" VARCHAR(2000),
    "center_approved_by_id" INTEGER,
    "center_approved_at" TIMESTAMP(3),
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_nomination_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_attempts" (
    "id" SERIAL NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "nomination_request_id" INTEGER,
    "exam_date" DATE NOT NULL,
    "full_quran_completed_at" DATE,
    "committee_notes" TEXT,
    "total_score" DOUBLE PRECISION,
    "grade_label" VARCHAR(40),
    "status" "public"."AttemptStatus" NOT NULL DEFAULT 'SCHEDULED',
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "evaluated_by_id" INTEGER,
    "evaluation_closed_by_id" INTEGER,
    "evaluation_closed_at" TIMESTAMP(3),
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "published_by_id" INTEGER,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_attempt_committee_members" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "assigned_by_id" INTEGER,
    "role_at_assignment" "public"."Role" NOT NULL,
    "committee_role" "public"."CommitteeRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_attempt_committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_attempt_questions" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "source" "public"."ExamQuestionSource" NOT NULL DEFAULT 'AUTO',
    "from_surah" INTEGER NOT NULL,
    "from_ayah" INTEGER NOT NULL,
    "to_surah" INTEGER NOT NULL,
    "to_ayah" INTEGER NOT NULL,
    "prompting_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reminding_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tajweed_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_evaluated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_attempt_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_attempt_breakdown" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "memorization_score" DOUBLE PRECISION,
    "tajweed_score" DOUBLE PRECISION,
    "performance_score" DOUBLE PRECISION,
    "prompting_deductions" DOUBLE PRECISION,
    "reminding_deductions" DOUBLE PRECISION,
    "tajweed_deductions" DOUBLE PRECISION,
    "theoretical_tajweed_score" DOUBLE PRECISION,
    "strength_notes" TEXT,
    "weakness_notes" TEXT,

    CONSTRAINT "exam_attempt_breakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."graduation_candidates" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "exam_id" INTEGER,
    "exam_attempt_id" INTEGER,
    "student_name_snapshot" VARCHAR(120) NOT NULL,
    "center_name_snapshot" VARCHAR(120) NOT NULL,
    "circle_name_snapshot" VARCHAR(120) NOT NULL,
    "memorization_completion_date" DATE,
    "khatma_test_date" DATE,
    "memorization_start_date" DATE,
    "memorization_duration_months" SMALLINT,
    "grade_snapshot" VARCHAR(40),
    "average_snapshot" DECIMAL(5,2),
    "notes" VARCHAR(1000),
    "status" "public"."GraduationCandidateStatus" NOT NULL DEFAULT 'NOMINATED',
    "status_note" VARCHAR(1000),
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "rejected_by_id" INTEGER,
    "rejected_at" TIMESTAMP(3),
    "deferred_by_id" INTEGER,
    "deferred_at" TIMESTAMP(3),
    "created_by_id" INTEGER NOT NULL,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "graduation_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."golden_records" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "source" "public"."GoldenRecordSource" NOT NULL,
    "candidate_id" INTEGER,
    "exam_id" INTEGER,
    "exam_attempt_id" INTEGER,
    "student_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "student_name_snapshot" VARCHAR(120) NOT NULL,
    "center_name_snapshot" VARCHAR(120) NOT NULL,
    "circle_name_snapshot" VARCHAR(120),
    "registry_serial" VARCHAR(40),
    "grade" VARCHAR(40) NOT NULL,
    "average" DECIMAL(5,2) NOT NULL,
    "appreciation" VARCHAR(60) NOT NULL,
    "exam_date" DATE NOT NULL,
    "type" "public"."GoldenRecordType" NOT NULL,
    "riwaya" "public"."RiwayaType",
    "notes" VARCHAR(1000),
    "status" "public"."GoldenRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "status_note" VARCHAR(1000),
    "submitted_by_id" INTEGER,
    "submitted_at" TIMESTAMP(3),
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "rejected_by_id" INTEGER,
    "rejected_at" TIMESTAMP(3),
    "created_by_id" INTEGER NOT NULL,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "golden_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_yearly_achievement_snapshots" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "achievement_category" "public"."AchievementCategory" NOT NULL,
    "juz_count" SMALLINT NOT NULL,
    "golden_record_id" INTEGER,
    "snapshot_source" VARCHAR(30) NOT NULL,
    "captured_by_id" INTEGER,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" VARCHAR(500),

    CONSTRAINT "student_yearly_achievement_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_grade_scales" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "min_percentage" DECIMAL(5,2) NOT NULL,
    "max_percentage" DECIMAL(5,2) NOT NULL,
    "color" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_question_bank_items" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "from_surah" INTEGER NOT NULL,
    "from_ayah" INTEGER NOT NULL,
    "to_surah" INTEGER NOT NULL,
    "to_ayah" INTEGER NOT NULL,
    "suggested_text" TEXT,
    "source" "public"."ExamQuestionSource" NOT NULL DEFAULT 'MANUAL',
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "page_number" INTEGER NOT NULL DEFAULT 1,
    "line_count" INTEGER NOT NULL DEFAULT 1,
    "difficulty_level" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "exam_question_bank_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tuition_plans" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "monthlyAmount" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),
    "planKind" "public"."TuitionPlanKind" NOT NULL DEFAULT 'MONTHLY',

    CONSTRAINT "tuition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_tuition_assignments" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "tuitionPlanId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "status" "public"."TuitionAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "student_tuition_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancel_reason" VARCHAR(500),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by_id" INTEGER,
    "dueDate" DATE,
    "invoiceType" "public"."InvoiceType" NOT NULL DEFAULT 'TUITION_MONTHLY',
    "lock_version" INTEGER NOT NULL DEFAULT 0,
    "notes" VARCHAR(500),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL DEFAULT 'CASH',
    "receivedById" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachment_storage_key" VARCHAR(255),
    "centerId" INTEGER,
    "external_transfer_ref" VARCHAR(120),
    "idempotencyKey" VARCHAR(128),
    "organizationId" INTEGER,
    "voucherId" INTEGER,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_policy_profiles" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "requireTransferAttachment" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalDisbursement" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalReceipt" BOOLEAN NOT NULL DEFAULT false,
    "allowFreeStudents" BOOLEAN NOT NULL DEFAULT true,
    "allowSymbolicOneTimeFee" BOOLEAN NOT NULL DEFAULT true,
    "allowOverdraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_policy_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_accounts" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "accounting_account_id" INTEGER,
    "accountType" "public"."FinanceAccountType" NOT NULL,
    "openingBalance" DECIMAL(12,2) NOT NULL,
    "currentBalance" DECIMAL(12,2) NOT NULL,
    "currencyCode" VARCHAR(8) NOT NULL DEFAULT 'YER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_vouchers" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "accountId" INTEGER NOT NULL,
    "voucherType" "public"."VoucherType" NOT NULL,
    "voucherNo" VARCHAR(80) NOT NULL,
    "sourceType" "public"."VoucherSourceType" NOT NULL,
    "sourceId" INTEGER,
    "paymentMethod" "public"."PaymentMethod",
    "amount" DECIMAL(12,2) NOT NULL,
    "originalAmount" DECIMAL(12,2),
    "originalCurrencyCode" VARCHAR(3),
    "exchangeRateToBase" DECIMAL(18,6),
    "status" "public"."VoucherStatus" NOT NULL DEFAULT 'DRAFT',
    "accountingCategory" "public"."VoucherAccountingCategory",
    "attachmentStorageKey" VARCHAR(255),
    "externalTransferRef" VARCHAR(120),
    "manualReferenceNo" VARCHAR(120),
    "notes" VARCHAR(500),
    "createdById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "postedById" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(500),
    "postedAt" TIMESTAMP(3),
    "voidRequestedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voucherDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_sequences" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "documentType" VARCHAR(40) NOT NULL,
    "year" SMALLINT NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."donors" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "name" VARCHAR(180) NOT NULL,
    "donorType" "public"."DonorType" NOT NULL,
    "phone" VARCHAR(40),
    "email" VARCHAR(180),
    "address" VARCHAR(255),
    "contactPerson" VARCHAR(180),
    "notes" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."donations" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "donorId" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "originalAmount" DECIMAL(12,2),
    "originalCurrencyCode" VARCHAR(3),
    "exchangeRateToBase" DECIMAL(18,6),
    "donationDate" DATE NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "purpose" VARCHAR(255),
    "status" "public"."DonationStatus" NOT NULL DEFAULT 'PLEDGED',
    "isPledge" BOOLEAN NOT NULL DEFAULT true,
    "pledgeDueDate" DATE,
    "receivedDate" DATE,
    "voucherId" INTEGER,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currencies" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "nameAr" VARCHAR(60) NOT NULL,
    "nameEn" VARCHAR(60) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exchange_rates" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL,
    "rateToBase" DECIMAL(18,6) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "source" VARCHAR(60),
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_account_movements" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "movementType" "public"."FinanceMovementType" NOT NULL,
    "direction" "public"."FinanceMovementDirection" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "reversalOfMovementId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_account_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_fund_transfers" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "fromAccountId" INTEGER NOT NULL,
    "toAccountId" INTEGER NOT NULL,
    "fromCenterId" INTEGER,
    "toCenterId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."FundTransferStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "voucherOutId" INTEGER,
    "voucherInId" INTEGER,
    "notes" VARCHAR(500),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(500),
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_fund_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounting_accounts" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "type" "public"."AccountingAccountType" NOT NULL,
    "normalBalance" "public"."AccountingNormalBalance" NOT NULL,
    "parentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "systemKey" VARCHAR(80),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_entries" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "entryNo" VARCHAR(80) NOT NULL,
    "entryDate" DATE NOT NULL,
    "sourceType" "public"."JournalSourceType" NOT NULL,
    "sourceId" INTEGER,
    "status" "public"."JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "description" VARCHAR(500),
    "postedById" INTEGER,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_entry_lines" (
    "id" SERIAL NOT NULL,
    "journalEntryId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "memo" VARCHAR(500),
    "sourceLineType" "public"."JournalSourceType",
    "sourceLineId" INTEGER,
    "organizationId" INTEGER NOT NULL,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_fee_profiles" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "feeMode" "public"."FeeMode" NOT NULL,
    "tuitionPlanId" INTEGER,
    "symbolicAmount" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_fee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_profiles" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "userId" INTEGER NOT NULL,
    "monthlyBaseAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethodDefault" "public"."PaymentMethod" NOT NULL DEFAULT 'CASH',
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salaryCurrencyCode" VARCHAR(8) NOT NULL DEFAULT 'YER',
    "bankAccountNumber" VARCHAR(80),
    "bankName" VARCHAR(120),
    "iban" VARCHAR(34),
    "salaryGradeId" INTEGER,
    "salarySource" "public"."SalarySource" NOT NULL DEFAULT 'GRADE',
    "overrideReason" VARCHAR(500),
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "payroll_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_grades" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "jobTitle" VARCHAR(120) NOT NULL,
    "gradeLevel" VARCHAR(60) NOT NULL,
    "baseSalary" DECIMAL(12,2) NOT NULL,
    "currencyCode" VARCHAR(8) NOT NULL DEFAULT 'YER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_assignments" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignmentType" "public"."StaffAssignmentType" NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "endReason" VARCHAR(500),
    "notes" VARCHAR(500),
    "createdById" INTEGER,
    "endedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_batches" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "status" "public"."PayrollBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalNetAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "approvedById" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(500),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_items" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "beneficiaryUserId" INTEGER NOT NULL,
    "center_id" INTEGER,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "originalAmount" DECIMAL(12,2),
    "originalCurrencyCode" VARCHAR(3),
    "exchangeRateToBase" DECIMAL(18,6),
    "bonusAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductionEventIds" JSONB,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "status" "public"."PayrollItemStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "public"."PaymentMethod",
    "paymentReference" VARCHAR(120),
    "failureReason" VARCHAR(500),
    "voucherId" INTEGER,
    "notes" VARCHAR(500),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reward_profiles" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "beneficiaryUserId" INTEGER NOT NULL,
    "beneficiaryRole" "public"."RewardBeneficiaryRole" NOT NULL,
    "cycle" "public"."RewardCycle" NOT NULL,
    "rewardType" "public"."RewardType",
    "defaultAmount" DECIMAL(12,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reward_batches" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "cycle" "public"."RewardCycle" NOT NULL,
    "rewardType" "public"."RewardType",
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER,
    "periodQuarter" INTEGER,
    "status" "public"."RewardBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "approvedById" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(500),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reward_items" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "beneficiaryUserId" INTEGER NOT NULL,
    "beneficiaryRole" "public"."RewardBeneficiaryRole" NOT NULL,
    "centerId" INTEGER NOT NULL,
    "circleId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "rankInCircle" INTEGER,
    "rewardType" "public"."RewardType",
    "status" "public"."RewardItemStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "public"."PaymentMethod",
    "paymentReference" VARCHAR(120),
    "failureReason" VARCHAR(500),
    "voucherId" INTEGER,
    "notes" VARCHAR(500),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_files" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "name" VARCHAR(180) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" VARCHAR(255) NOT NULL,
    "kind" "public"."ReportFileKind" NOT NULL,
    "createdById" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_runs" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "reportType" "public"."ReportType" NOT NULL,
    "status" "public"."ReportRunStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" INTEGER NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "filters" JSONB NOT NULL,
    "summary" JSONB,
    "errorMessage" VARCHAR(500),
    "outputFileId" INTEGER,

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "type" "public"."NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "payload" JSONB NOT NULL,
    "recipientUserId" INTEGER NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "actorUserId" INTEGER,
    "actorRole" VARCHAR(40) NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "entityType" "public"."AuditEntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "summary" VARCHAR(255) NOT NULL,
    "metadata" JSONB NOT NULL,
    "ip" VARCHAR(64),
    "userAgent" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."library_categories" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."library_items" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER,
    "circle_id" INTEGER,
    "category_id" INTEGER,
    "bookCategory" "public"."BookCategory",
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "cover_storage_key" VARCHAR(255),
    "visibility" "public"."LibraryVisibility" NOT NULL,
    "status" "public"."LibraryItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "type" "public"."LibraryItemType" NOT NULL DEFAULT 'DOCUMENT',

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."monthly_plans" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "month" SMALLINT NOT NULL,
    "year" SMALLINT NOT NULL,
    "hifz_from_surah" INTEGER,
    "hifz_from_ayah" INTEGER,
    "hifz_to_surah" INTEGER,
    "hifz_to_ayah" INTEGER,
    "hifz_target_pages" DECIMAL(5,1),
    "hifz_daily_rate" DECIMAL(5,2),
    "review_from_surah" INTEGER,
    "review_from_ayah" INTEGER,
    "review_to_surah" INTEGER,
    "review_to_ayah" INTEGER,
    "review_target_pages" DECIMAL(5,1),
    "review_daily_rate" DECIMAL(5,2),
    "status" "public"."MonthlyPlanStatus" NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_activities" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "activity_date" DATE NOT NULL,
    "activityType" "public"."GroupActivityType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_activity_participants" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_activity_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review_plan_settings" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "teacher_id" INTEGER NOT NULL,
    "juz_threshold_5" DECIMAL(5,1) NOT NULL DEFAULT 10,
    "juz_threshold_10" DECIMAL(5,1) NOT NULL DEFAULT 15,
    "juz_threshold_20" DECIMAL(5,1) NOT NULL DEFAULT 20,
    "juz_threshold_30" DECIMAL(5,1) NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_plan_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_settings" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "baseCurrencyCode" VARCHAR(8) NOT NULL DEFAULT 'YER',
    "fiscalYearStartMonth" SMALLINT NOT NULL DEFAULT 1,
    "roundingPolicy" VARCHAR(40),
    "defaultCashAccountId" INTEGER,
    "defaultBankAccountId" INTEGER,
    "defaultStudentRevenueAccountId" INTEGER,
    "defaultDonationRevenueAccountId" INTEGER,
    "defaultPayrollExpenseAccountId" INTEGER,
    "defaultOperatingExpenseAccountId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fiscal_years" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "public"."FiscalPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fiscal_periods" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "periodNumber" SMALLINT NOT NULL,
    "periodName" VARCHAR(60) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "public"."FiscalPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."suppliers" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(32),
    "address" VARCHAR(255),
    "notes" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expense_categories" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" VARCHAR(60),
    "accounting_account_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expense_invoices" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER,
    "supplier_id" INTEGER,
    "category_id" INTEGER NOT NULL,
    "invoice_no" VARCHAR(80),
    "invoice_date" DATE NOT NULL,
    "due_date" DATE,
    "description" VARCHAR(500) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."ExpenseInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expense_payments" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "finance_account_id" INTEGER,
    "voucher_id" INTEGER,
    "journal_entry_id" INTEGER,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset_categories" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "asset_account_id" INTEGER,
    "depreciation_expense_account_id" INTEGER,
    "accumulated_depreciation_account_id" INTEGER,
    "useful_life_months" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fixed_assets" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER,
    "category_id" INTEGER NOT NULL,
    "asset_code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(500),
    "purchase_date" DATE NOT NULL,
    "purchase_cost" DECIMAL(12,2) NOT NULL,
    "current_value" DECIMAL(12,2),
    "useful_life_months" INTEGER,
    "status" "public"."FixedAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "location" VARCHAR(255),
    "custodian_user_id" INTEGER,
    "supplier_id" INTEGER,
    "expense_invoice_id" INTEGER,
    "acquisition_journal_entry_id" INTEGER,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset_custody_logs" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "from_user_id" INTEGER,
    "to_user_id" INTEGER,
    "center_id" INTEGER,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "notes" VARCHAR(500),
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_custody_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset_depreciation_entries" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "period_year" SMALLINT NOT NULL,
    "period_month" SMALLINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "journal_entry_id" INTEGER,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_depreciation_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "public"."organizations"("code");

-- CreateIndex
CREATE INDEX "centers_organizationId_idx" ON "public"."centers"("organizationId");

-- CreateIndex
CREATE INDEX "centers_organizationId_timezone_idx" ON "public"."centers"("organizationId", "timezone");

-- CreateIndex
CREATE INDEX "centers_center_admin_user_id_idx" ON "public"."centers"("center_admin_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "centers_organizationId_code_key" ON "public"."centers"("organizationId", "code");

-- CreateIndex
CREATE INDEX "circles_centerId_idx" ON "public"."circles"("centerId");

-- CreateIndex
CREATE INDEX "circles_primary_teacher_user_id_idx" ON "public"."circles"("primary_teacher_user_id");

-- CreateIndex
CREATE INDEX "circles_gender_idx" ON "public"."circles"("gender");

-- CreateIndex
CREATE INDEX "circles_circle_type_idx" ON "public"."circles"("circle_type");

-- CreateIndex
CREATE UNIQUE INDEX "circles_centerId_name_ar_key" ON "public"."circles"("centerId", "name_ar");

-- CreateIndex
CREATE INDEX "circle_schedule_slots_circle_id_idx" ON "public"."circle_schedule_slots"("circle_id");

-- CreateIndex
CREATE UNIQUE INDEX "circle_schedule_slots_circle_id_day_of_week_key" ON "public"."circle_schedule_slots"("circle_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "remote_recitation_settings_circle_id_key" ON "public"."remote_recitation_settings"("circle_id");

-- CreateIndex
CREATE INDEX "remote_recitation_settings_center_id_idx" ON "public"."remote_recitation_settings"("center_id");

-- CreateIndex
CREATE INDEX "remote_recitation_slots_center_id_starts_at_idx" ON "public"."remote_recitation_slots"("center_id", "starts_at");

-- CreateIndex
CREATE INDEX "remote_recitation_slots_circle_id_starts_at_idx" ON "public"."remote_recitation_slots"("circle_id", "starts_at");

-- CreateIndex
CREATE INDEX "remote_recitation_slots_teacher_id_starts_at_idx" ON "public"."remote_recitation_slots"("teacher_id", "starts_at");

-- CreateIndex
CREATE INDEX "remote_recitation_slots_is_active_starts_at_idx" ON "public"."remote_recitation_slots"("is_active", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "remote_recitation_bookings_follow_up_record_id_key" ON "public"."remote_recitation_bookings"("follow_up_record_id");

-- CreateIndex
CREATE INDEX "remote_recitation_bookings_center_id_status_requested_at_idx" ON "public"."remote_recitation_bookings"("center_id", "status", "requested_at");

-- CreateIndex
CREATE INDEX "remote_recitation_bookings_circle_id_status_requested_at_idx" ON "public"."remote_recitation_bookings"("circle_id", "status", "requested_at");

-- CreateIndex
CREATE INDEX "remote_recitation_bookings_slot_id_idx" ON "public"."remote_recitation_bookings"("slot_id");

-- CreateIndex
CREATE INDEX "remote_recitation_bookings_student_id_status_requested_at_idx" ON "public"."remote_recitation_bookings"("student_id", "status", "requested_at");

-- CreateIndex
CREATE INDEX "remote_recitation_bookings_teacher_id_status_requested_at_idx" ON "public"."remote_recitation_bookings"("teacher_id", "status", "requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "public"."users"("organizationId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");

-- CreateIndex
CREATE INDEX "users_createdByUserId_idx" ON "public"."users"("createdByUserId");

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "public"."users"("lastLoginAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_phone_key" ON "public"."user_profiles"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_phone_normalized_key" ON "public"."user_profiles"("phone_normalized");

-- CreateIndex
CREATE INDEX "user_profiles_fullName_idx" ON "public"."user_profiles"("fullName");

-- CreateIndex
CREATE INDEX "user_profiles_createdByUserId_idx" ON "public"."user_profiles"("createdByUserId");

-- CreateIndex
CREATE INDEX "teacher_profiles_createdByUserId_idx" ON "public"."teacher_profiles"("createdByUserId");

-- CreateIndex
CREATE INDEX "supervisor_profiles_status_idx" ON "public"."supervisor_profiles"("status");

-- CreateIndex
CREATE INDEX "supervisor_profiles_createdByUserId_idx" ON "public"."supervisor_profiles"("createdByUserId");

-- CreateIndex
CREATE INDEX "center_admin_profiles_employmentStatus_idx" ON "public"."center_admin_profiles"("employmentStatus");

-- CreateIndex
CREATE INDEX "center_admin_profiles_createdByUserId_idx" ON "public"."center_admin_profiles"("createdByUserId");

-- CreateIndex
CREATE INDEX "student_profiles_level_idx" ON "public"."student_profiles"("level");

-- CreateIndex
CREATE INDEX "student_profiles_studentStatus_idx" ON "public"."student_profiles"("studentStatus");

-- CreateIndex
CREATE INDEX "student_profiles_createdByUserId_idx" ON "public"."student_profiles"("createdByUserId");

-- CreateIndex
CREATE INDEX "parent_profiles_relationType_idx" ON "public"."parent_profiles"("relationType");

-- CreateIndex
CREATE INDEX "parent_profiles_createdByUserId_idx" ON "public"."parent_profiles"("createdByUserId");

-- CreateIndex
CREATE INDEX "center_supervisors_centerId_idx" ON "public"."center_supervisors"("centerId");

-- CreateIndex
CREATE INDEX "center_supervisors_supervisor_user_id_idx" ON "public"."center_supervisors"("supervisor_user_id");

-- CreateIndex
CREATE INDEX "center_supervisors_is_active_idx" ON "public"."center_supervisors"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "center_supervisors_centerId_supervisor_user_id_key" ON "public"."center_supervisors"("centerId", "supervisor_user_id");

-- CreateIndex
CREATE INDEX "user_center_accesses_centerId_idx" ON "public"."user_center_accesses"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_center_accesses_userId_centerId_key" ON "public"."user_center_accesses"("userId", "centerId");

-- CreateIndex
CREATE INDEX "user_circle_accesses_circleId_idx" ON "public"."user_circle_accesses"("circleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_circle_accesses_userId_circleId_key" ON "public"."user_circle_accesses"("userId", "circleId");

-- CreateIndex
CREATE INDEX "student_circle_enrollments_circleId_idx" ON "public"."student_circle_enrollments"("circleId");

-- CreateIndex
CREATE INDEX "student_circle_enrollments_status_idx" ON "public"."student_circle_enrollments"("status");

-- CreateIndex
CREATE INDEX "student_circle_enrollments_studentId_status_idx" ON "public"."student_circle_enrollments"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "student_circle_enrollments_studentId_circleId_key" ON "public"."student_circle_enrollments"("studentId", "circleId");

-- CreateIndex
CREATE INDEX "parent_student_links_studentId_idx" ON "public"."parent_student_links"("studentId");

-- CreateIndex
CREATE INDEX "parent_student_links_createdByUserId_idx" ON "public"."parent_student_links"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_student_links_parentId_studentId_key" ON "public"."parent_student_links"("parentId", "studentId");

-- CreateIndex
CREATE INDEX "attendance_records_circleId_attendanceDate_idx" ON "public"."attendance_records"("circleId", "attendanceDate");

-- CreateIndex
CREATE INDEX "attendance_records_circleId_attendanceDate_lock_version_idx" ON "public"."attendance_records"("circleId", "attendanceDate", "lock_version");

-- CreateIndex
CREATE INDEX "attendance_records_studentId_attendanceDate_idx" ON "public"."attendance_records"("studentId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_studentId_circleId_attendanceDate_key" ON "public"."attendance_records"("studentId", "circleId", "attendanceDate");

-- CreateIndex
CREATE INDEX "staff_attendance_records_center_id_attendance_date_idx" ON "public"."staff_attendance_records"("center_id", "attendance_date");

-- CreateIndex
CREATE INDEX "staff_attendance_records_organization_id_attendance_date_idx" ON "public"."staff_attendance_records"("organization_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_records_user_id_attendance_date_key" ON "public"."staff_attendance_records"("user_id", "attendance_date");

-- CreateIndex
CREATE INDEX "staff_excuse_requests_center_id_status_idx" ON "public"."staff_excuse_requests"("center_id", "status");

-- CreateIndex
CREATE INDEX "staff_excuse_requests_user_id_absence_date_idx" ON "public"."staff_excuse_requests"("user_id", "absence_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_policies_organization_id_key" ON "public"."attendance_policies"("organization_id");

-- CreateIndex
CREATE INDEX "staff_schedule_assignments_organization_id_idx" ON "public"."staff_schedule_assignments"("organization_id");

-- CreateIndex
CREATE INDEX "staff_schedule_assignments_user_id_is_active_idx" ON "public"."staff_schedule_assignments"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "staff_schedule_assignments_center_id_idx" ON "public"."staff_schedule_assignments"("center_id");

-- CreateIndex
CREATE INDEX "staff_schedule_slots_assignment_id_idx" ON "public"."staff_schedule_slots"("assignment_id");

-- CreateIndex
CREATE INDEX "staff_leave_requests_organization_id_status_idx" ON "public"."staff_leave_requests"("organization_id", "status");

-- CreateIndex
CREATE INDEX "staff_leave_requests_user_id_start_date_idx" ON "public"."staff_leave_requests"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "staff_leave_requests_center_id_idx" ON "public"."staff_leave_requests"("center_id");

-- CreateIndex
CREATE INDEX "supervisor_visit_plans_organization_id_idx" ON "public"."supervisor_visit_plans"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_visit_plans_supervisor_id_center_id_month_year_key" ON "public"."supervisor_visit_plans"("supervisor_id", "center_id", "month", "year");

-- CreateIndex
CREATE INDEX "supervisor_visit_plan_items_plan_id_idx" ON "public"."supervisor_visit_plan_items"("plan_id");

-- CreateIndex
CREATE INDEX "supervisor_visit_plan_items_planned_date_idx" ON "public"."supervisor_visit_plan_items"("planned_date");

-- CreateIndex
CREATE INDEX "supervisor_visit_logs_organization_id_idx" ON "public"."supervisor_visit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "supervisor_visit_logs_supervisor_id_started_at_idx" ON "public"."supervisor_visit_logs"("supervisor_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "finance_deduction_rules_organization_id_trigger_type_key" ON "public"."finance_deduction_rules"("organization_id", "trigger_type");

-- CreateIndex
CREATE INDEX "finance_deduction_events_organization_id_month_year_idx" ON "public"."finance_deduction_events"("organization_id", "month", "year");

-- CreateIndex
CREATE INDEX "finance_deduction_events_user_id_idx" ON "public"."finance_deduction_events"("user_id");

-- CreateIndex
CREATE INDEX "finance_deduction_events_payroll_batch_id_idx" ON "public"."finance_deduction_events"("payroll_batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_deduction_events_organization_id_user_id_month_year_key" ON "public"."finance_deduction_events"("organization_id", "user_id", "month", "year", "trigger_type");

-- CreateIndex
CREATE INDEX "follow_up_records_student_id_record_date_idx" ON "public"."follow_up_records"("student_id", "record_date");

-- CreateIndex
CREATE INDEX "follow_up_records_circle_id_record_date_idx" ON "public"."follow_up_records"("circle_id", "record_date");

-- CreateIndex
CREATE INDEX "follow_up_records_status_record_date_idx" ON "public"."follow_up_records"("status", "record_date");

-- CreateIndex
CREATE INDEX "follow_up_records_matn_id_idx" ON "public"."follow_up_records"("matn_id");

-- CreateIndex
CREATE INDEX "matn_catalogs_organization_id_is_active_idx" ON "public"."matn_catalogs"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "matn_catalogs_organization_id_code_key" ON "public"."matn_catalogs"("organization_id", "code");

-- CreateIndex
CREATE INDEX "supervisor_notes_organization_id_center_id_idx" ON "public"."supervisor_notes"("organization_id", "center_id");

-- CreateIndex
CREATE INDEX "supervisor_notes_circle_id_idx" ON "public"."supervisor_notes"("circle_id");

-- CreateIndex
CREATE INDEX "supervisor_notes_supervisor_id_idx" ON "public"."supervisor_notes"("supervisor_id");

-- CreateIndex
CREATE INDEX "supervisor_notes_category_idx" ON "public"."supervisor_notes"("category");

-- CreateIndex
CREATE INDEX "supervisor_notes_status_idx" ON "public"."supervisor_notes"("status");

-- CreateIndex
CREATE INDEX "correction_requests_organization_id_status_created_at_idx" ON "public"."correction_requests"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "correction_requests_target_type_target_id_idx" ON "public"."correction_requests"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "correction_requests_requested_by_id_created_at_idx" ON "public"."correction_requests"("requested_by_id", "created_at");

-- CreateIndex
CREATE INDEX "quran_ayah_index_page_number_idx" ON "public"."quran_ayah_index"("page_number");

-- CreateIndex
CREATE INDEX "quran_ayah_index_fetched_at_idx" ON "public"."quran_ayah_index"("fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "quran_ayah_index_surah_number_ayah_number_key" ON "public"."quran_ayah_index"("surah_number", "ayah_number");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "public"."refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "public"."refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_revokedAt_idx" ON "public"."refresh_tokens"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_revokedAt_idx" ON "public"."refresh_tokens"("expiresAt", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "public"."password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "public"."password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_used_at_idx" ON "public"."password_reset_tokens"("user_id", "used_at");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_used_at_idx" ON "public"."password_reset_tokens"("expires_at", "used_at");

-- CreateIndex
CREATE INDEX "activity_logs_organizationId_createdAt_idx" ON "public"."activity_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_centerId_createdAt_idx" ON "public"."activity_logs"("centerId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_circleId_createdAt_idx" ON "public"."activity_logs"("circleId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_createdAt_idx" ON "public"."activity_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "exams_organization_id_center_id_status_idx" ON "public"."exams"("organization_id", "center_id", "status");

-- CreateIndex
CREATE INDEX "exams_organization_id_center_id_purpose_status_idx" ON "public"."exams"("organization_id", "center_id", "purpose", "status");

-- CreateIndex
CREATE INDEX "exams_circle_id_idx" ON "public"."exams"("circle_id");

-- CreateIndex
CREATE INDEX "exams_purpose_scheduled_at_idx" ON "public"."exams"("purpose", "scheduled_at");

-- CreateIndex
CREATE INDEX "exams_scheduled_at_idx" ON "public"."exams"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "exam_criteria_exam_id_key" ON "public"."exam_criteria"("exam_id");

-- CreateIndex
CREATE INDEX "exam_nomination_requests_organization_id_status_created_at_idx" ON "public"."exam_nomination_requests"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "exam_nomination_requests_center_id_status_created_at_idx" ON "public"."exam_nomination_requests"("center_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "exam_nomination_requests_circle_id_status_created_at_idx" ON "public"."exam_nomination_requests"("circle_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "exam_nomination_requests_student_id_status_created_at_idx" ON "public"."exam_nomination_requests"("student_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "exam_nomination_requests_exam_id_status_created_at_idx" ON "public"."exam_nomination_requests"("exam_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempts_nomination_request_id_key" ON "public"."exam_attempts"("nomination_request_id");

-- CreateIndex
CREATE INDEX "exam_attempts_exam_id_status_idx" ON "public"."exam_attempts"("exam_id", "status");

-- CreateIndex
CREATE INDEX "exam_attempts_circle_id_idx" ON "public"."exam_attempts"("circle_id");

-- CreateIndex
CREATE INDEX "exam_attempts_exam_date_idx" ON "public"."exam_attempts"("exam_date");

-- CreateIndex
CREATE INDEX "exam_attempts_student_id_status_idx" ON "public"."exam_attempts"("student_id", "status");

-- CreateIndex
CREATE INDEX "exam_attempts_status_approved_at_idx" ON "public"."exam_attempts"("status", "approved_at");

-- CreateIndex
CREATE INDEX "exam_attempts_status_published_at_idx" ON "public"."exam_attempts"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempts_exam_id_student_id_exam_date_key" ON "public"."exam_attempts"("exam_id", "student_id", "exam_date");

-- CreateIndex
CREATE INDEX "exam_attempt_committee_members_user_id_idx" ON "public"."exam_attempt_committee_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempt_committee_members_attempt_id_user_id_key" ON "public"."exam_attempt_committee_members"("attempt_id", "user_id");

-- CreateIndex
CREATE INDEX "exam_attempt_questions_attempt_id_source_idx" ON "public"."exam_attempt_questions"("attempt_id", "source");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempt_questions_attempt_id_order_index_key" ON "public"."exam_attempt_questions"("attempt_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempt_breakdown_attempt_id_key" ON "public"."exam_attempt_breakdown"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "graduation_candidates_exam_attempt_id_key" ON "public"."graduation_candidates"("exam_attempt_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_organization_id_year_center_id_status_idx" ON "public"."graduation_candidates"("organization_id", "year", "center_id", "status");

-- CreateIndex
CREATE INDEX "graduation_candidates_student_id_year_idx" ON "public"."graduation_candidates"("student_id", "year");

-- CreateIndex
CREATE INDEX "graduation_candidates_center_id_year_idx" ON "public"."graduation_candidates"("center_id", "year");

-- CreateIndex
CREATE INDEX "graduation_candidates_circle_id_year_idx" ON "public"."graduation_candidates"("circle_id", "year");

-- CreateIndex
CREATE INDEX "graduation_candidates_status_year_idx" ON "public"."graduation_candidates"("status", "year");

-- CreateIndex
CREATE INDEX "graduation_candidates_exam_id_idx" ON "public"."graduation_candidates"("exam_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_created_by_id_idx" ON "public"."graduation_candidates"("created_by_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_updated_by_id_idx" ON "public"."graduation_candidates"("updated_by_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_approved_by_id_idx" ON "public"."graduation_candidates"("approved_by_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_rejected_by_id_idx" ON "public"."graduation_candidates"("rejected_by_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_deferred_by_id_idx" ON "public"."graduation_candidates"("deferred_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "graduation_candidates_organization_id_student_id_year_key" ON "public"."graduation_candidates"("organization_id", "student_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "golden_records_candidate_id_key" ON "public"."golden_records"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "golden_records_exam_attempt_id_key" ON "public"."golden_records"("exam_attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "golden_records_registry_serial_key" ON "public"."golden_records"("registry_serial");

-- CreateIndex
CREATE INDEX "golden_records_organization_id_year_center_id_status_idx" ON "public"."golden_records"("organization_id", "year", "center_id", "status");

-- CreateIndex
CREATE INDEX "golden_records_organization_id_year_type_idx" ON "public"."golden_records"("organization_id", "year", "type");

-- CreateIndex
CREATE INDEX "golden_records_organization_id_year_riwaya_idx" ON "public"."golden_records"("organization_id", "year", "riwaya");

-- CreateIndex
CREATE INDEX "golden_records_student_id_year_idx" ON "public"."golden_records"("student_id", "year");

-- CreateIndex
CREATE INDEX "golden_records_exam_id_idx" ON "public"."golden_records"("exam_id");

-- CreateIndex
CREATE INDEX "golden_records_circle_id_idx" ON "public"."golden_records"("circle_id");

-- CreateIndex
CREATE INDEX "golden_records_created_by_id_idx" ON "public"."golden_records"("created_by_id");

-- CreateIndex
CREATE INDEX "golden_records_updated_by_id_idx" ON "public"."golden_records"("updated_by_id");

-- CreateIndex
CREATE INDEX "golden_records_submitted_by_id_idx" ON "public"."golden_records"("submitted_by_id");

-- CreateIndex
CREATE INDEX "golden_records_approved_by_id_idx" ON "public"."golden_records"("approved_by_id");

-- CreateIndex
CREATE INDEX "golden_records_rejected_by_id_idx" ON "public"."golden_records"("rejected_by_id");

-- CreateIndex
CREATE INDEX "golden_records_approved_at_idx" ON "public"."golden_records"("approved_at");

-- CreateIndex
CREATE UNIQUE INDEX "golden_records_organization_id_student_id_year_type_key" ON "public"."golden_records"("organization_id", "student_id", "year", "type");

-- CreateIndex
CREATE UNIQUE INDEX "student_yearly_achievement_snapshots_golden_record_id_key" ON "public"."student_yearly_achievement_snapshots"("golden_record_id");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_organization_id_year_c_idx" ON "public"."student_yearly_achievement_snapshots"("organization_id", "year", "center_id", "achievement_category");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_organization_id_year_a_idx" ON "public"."student_yearly_achievement_snapshots"("organization_id", "year", "achievement_category");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_student_id_year_idx" ON "public"."student_yearly_achievement_snapshots"("student_id", "year");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_center_id_year_idx" ON "public"."student_yearly_achievement_snapshots"("center_id", "year");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_circle_id_year_idx" ON "public"."student_yearly_achievement_snapshots"("circle_id", "year");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_captured_by_id_idx" ON "public"."student_yearly_achievement_snapshots"("captured_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_yearly_achievement_snapshots_organization_id_studen_key" ON "public"."student_yearly_achievement_snapshots"("organization_id", "student_id", "year");

-- CreateIndex
CREATE INDEX "exam_grade_scales_organization_id_is_active_idx" ON "public"."exam_grade_scales"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "exam_question_bank_items_organization_id_created_at_idx" ON "public"."exam_question_bank_items"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "exam_question_bank_items_from_surah_to_surah_idx" ON "public"."exam_question_bank_items"("from_surah", "to_surah");

-- CreateIndex
CREATE INDEX "tuition_plans_organizationId_idx" ON "public"."tuition_plans"("organizationId");

-- CreateIndex
CREATE INDEX "tuition_plans_planKind_isActive_idx" ON "public"."tuition_plans"("planKind", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tuition_plans_centerId_name_key" ON "public"."tuition_plans"("centerId", "name");

-- CreateIndex
CREATE INDEX "student_tuition_assignments_tuitionPlanId_idx" ON "public"."student_tuition_assignments"("tuitionPlanId");

-- CreateIndex
CREATE INDEX "student_tuition_assignments_status_idx" ON "public"."student_tuition_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_tuition_assignments_studentId_tuitionPlanId_key" ON "public"."student_tuition_assignments"("studentId", "tuitionPlanId");

-- CreateIndex
CREATE INDEX "invoices_centerId_year_month_idx" ON "public"."invoices"("centerId", "year", "month");

-- CreateIndex
CREATE INDEX "invoices_studentId_idx" ON "public"."invoices"("studentId");

-- CreateIndex
CREATE INDEX "invoices_status_dueDate_idx" ON "public"."invoices"("status", "dueDate");

-- CreateIndex
CREATE INDEX "invoices_cancelled_at_idx" ON "public"."invoices"("cancelled_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_studentId_month_year_key" ON "public"."invoices"("studentId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "payments_voucherId_key" ON "public"."payments"("voucherId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_receivedAt_idx" ON "public"."payments"("invoiceId", "receivedAt");

-- CreateIndex
CREATE INDEX "payments_receivedById_idx" ON "public"."payments"("receivedById");

-- CreateIndex
CREATE INDEX "payments_organizationId_centerId_createdAt_idx" ON "public"."payments"("organizationId", "centerId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_method_createdAt_idx" ON "public"."payments"("method", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_organizationId_idempotencyKey_key" ON "public"."payments"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "finance_policy_profiles_organizationId_centerId_idx" ON "public"."finance_policy_profiles"("organizationId", "centerId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_policy_profiles_organizationId_centerId_key" ON "public"."finance_policy_profiles"("organizationId", "centerId");

-- CreateIndex
CREATE INDEX "finance_accounts_accounting_account_id_idx" ON "public"."finance_accounts"("accounting_account_id");

-- CreateIndex
CREATE INDEX "finance_accounts_organizationId_centerId_isActive_idx" ON "public"."finance_accounts"("organizationId", "centerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "finance_accounts_organizationId_accountType_centerId_key" ON "public"."finance_accounts"("organizationId", "accountType", "centerId");

-- CreateIndex
CREATE INDEX "finance_vouchers_organizationId_centerId_status_createdAt_idx" ON "public"."finance_vouchers"("organizationId", "centerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "finance_vouchers_sourceType_sourceId_idx" ON "public"."finance_vouchers"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "finance_vouchers_accountId_postedAt_idx" ON "public"."finance_vouchers"("accountId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "finance_vouchers_organizationId_voucherNo_key" ON "public"."finance_vouchers"("organizationId", "voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "document_sequences_organizationId_documentType_year_key" ON "public"."document_sequences"("organizationId", "documentType", "year");

-- CreateIndex
CREATE INDEX "donors_organizationId_centerId_isActive_idx" ON "public"."donors"("organizationId", "centerId", "isActive");

-- CreateIndex
CREATE INDEX "donors_organizationId_donorType_idx" ON "public"."donors"("organizationId", "donorType");

-- CreateIndex
CREATE UNIQUE INDEX "donations_voucherId_key" ON "public"."donations"("voucherId");

-- CreateIndex
CREATE INDEX "donations_organizationId_centerId_status_donationDate_idx" ON "public"."donations"("organizationId", "centerId", "status", "donationDate");

-- CreateIndex
CREATE INDEX "donations_donorId_status_idx" ON "public"."donations"("donorId", "status");

-- CreateIndex
CREATE INDEX "currencies_organizationId_isActive_idx" ON "public"."currencies"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "currencies_organizationId_isBase_idx" ON "public"."currencies"("organizationId", "isBase");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_organizationId_code_key" ON "public"."currencies"("organizationId", "code");

-- CreateIndex
CREATE INDEX "exchange_rates_organizationId_currencyCode_effectiveDate_idx" ON "public"."exchange_rates"("organizationId", "currencyCode", "effectiveDate");

-- CreateIndex
CREATE INDEX "exchange_rates_organizationId_currencyCode_createdAt_idx" ON "public"."exchange_rates"("organizationId", "currencyCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "finance_account_movements_voucherId_key" ON "public"."finance_account_movements"("voucherId");

-- CreateIndex
CREATE INDEX "finance_account_movements_accountId_postedAt_id_idx" ON "public"."finance_account_movements"("accountId", "postedAt", "id");

-- CreateIndex
CREATE INDEX "finance_account_movements_organizationId_movementType_poste_idx" ON "public"."finance_account_movements"("organizationId", "movementType", "postedAt");

-- CreateIndex
CREATE INDEX "finance_account_movements_reversalOfMovementId_idx" ON "public"."finance_account_movements"("reversalOfMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_fund_transfers_voucherOutId_key" ON "public"."finance_fund_transfers"("voucherOutId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_fund_transfers_voucherInId_key" ON "public"."finance_fund_transfers"("voucherInId");

-- CreateIndex
CREATE INDEX "finance_fund_transfers_organizationId_status_createdAt_idx" ON "public"."finance_fund_transfers"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "finance_fund_transfers_fromAccountId_toAccountId_status_idx" ON "public"."finance_fund_transfers"("fromAccountId", "toAccountId", "status");

-- CreateIndex
CREATE INDEX "accounting_accounts_organizationId_type_isActive_idx" ON "public"."accounting_accounts"("organizationId", "type", "isActive");

-- CreateIndex
CREATE INDEX "accounting_accounts_organizationId_centerId_idx" ON "public"."accounting_accounts"("organizationId", "centerId");

-- CreateIndex
CREATE INDEX "accounting_accounts_parentId_idx" ON "public"."accounting_accounts"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_organizationId_code_key" ON "public"."accounting_accounts"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_organizationId_systemKey_key" ON "public"."accounting_accounts"("organizationId", "systemKey");

-- CreateIndex
CREATE INDEX "journal_entries_organizationId_entryDate_idx" ON "public"."journal_entries"("organizationId", "entryDate");

-- CreateIndex
CREATE INDEX "journal_entries_organizationId_status_entryDate_idx" ON "public"."journal_entries"("organizationId", "status", "entryDate");

-- CreateIndex
CREATE INDEX "journal_entries_centerId_entryDate_idx" ON "public"."journal_entries"("centerId", "entryDate");

-- CreateIndex
CREATE INDEX "journal_entries_postedById_idx" ON "public"."journal_entries"("postedById");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_organizationId_entryNo_key" ON "public"."journal_entries"("organizationId", "entryNo");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_organizationId_sourceType_sourceId_key" ON "public"."journal_entries"("organizationId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journalEntryId_idx" ON "public"."journal_entry_lines"("journalEntryId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_accountId_idx" ON "public"."journal_entry_lines"("accountId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_centerId_idx" ON "public"."journal_entry_lines"("centerId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_organizationId_accountId_idx" ON "public"."journal_entry_lines"("organizationId", "accountId");

-- CreateIndex
CREATE INDEX "student_fee_profiles_centerId_studentId_isActive_idx" ON "public"."student_fee_profiles"("centerId", "studentId", "isActive");

-- CreateIndex
CREATE INDEX "student_fee_profiles_organizationId_feeMode_isActive_idx" ON "public"."student_fee_profiles"("organizationId", "feeMode", "isActive");

-- CreateIndex
CREATE INDEX "payroll_profiles_centerId_userId_isActive_idx" ON "public"."payroll_profiles"("centerId", "userId", "isActive");

-- CreateIndex
CREATE INDEX "payroll_profiles_organizationId_isActive_idx" ON "public"."payroll_profiles"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "salary_grades_organizationId_isActive_idx" ON "public"."salary_grades"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "salary_grades_centerId_isActive_idx" ON "public"."salary_grades"("centerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "salary_grades_organizationId_centerId_jobTitle_gradeLevel_key" ON "public"."salary_grades"("organizationId", "centerId", "jobTitle", "gradeLevel");

-- CreateIndex
CREATE INDEX "staff_assignments_organizationId_userId_isActive_idx" ON "public"."staff_assignments"("organizationId", "userId", "isActive");

-- CreateIndex
CREATE INDEX "staff_assignments_centerId_assignmentType_isActive_idx" ON "public"."staff_assignments"("centerId", "assignmentType", "isActive");

-- CreateIndex
CREATE INDEX "staff_assignments_circleId_assignmentType_isActive_idx" ON "public"."staff_assignments"("circleId", "assignmentType", "isActive");

-- CreateIndex
CREATE INDEX "staff_assignments_userId_assignmentType_isActive_idx" ON "public"."staff_assignments"("userId", "assignmentType", "isActive");

-- CreateIndex
CREATE INDEX "payroll_batches_organizationId_centerId_status_idx" ON "public"."payroll_batches"("organizationId", "centerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_items_voucherId_key" ON "public"."payroll_items"("voucherId");

-- CreateIndex
CREATE INDEX "payroll_items_batchId_status_idx" ON "public"."payroll_items"("batchId", "status");

-- CreateIndex
CREATE INDEX "payroll_items_beneficiaryUserId_status_idx" ON "public"."payroll_items"("beneficiaryUserId", "status");

-- CreateIndex
CREATE INDEX "payroll_items_center_id_idx" ON "public"."payroll_items"("center_id");

-- CreateIndex
CREATE INDEX "reward_profiles_organizationId_beneficiaryUserId_isActive_idx" ON "public"."reward_profiles"("organizationId", "beneficiaryUserId", "isActive");

-- CreateIndex
CREATE INDEX "reward_profiles_centerId_cycle_isActive_idx" ON "public"."reward_profiles"("centerId", "cycle", "isActive");

-- CreateIndex
CREATE INDEX "reward_batches_organizationId_cycle_periodYear_status_idx" ON "public"."reward_batches"("organizationId", "cycle", "periodYear", "status");

-- CreateIndex
CREATE INDEX "reward_batches_centerId_status_idx" ON "public"."reward_batches"("centerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reward_items_voucherId_key" ON "public"."reward_items"("voucherId");

-- CreateIndex
CREATE INDEX "reward_items_batchId_status_idx" ON "public"."reward_items"("batchId", "status");

-- CreateIndex
CREATE INDEX "reward_items_beneficiaryUserId_status_idx" ON "public"."reward_items"("beneficiaryUserId", "status");

-- CreateIndex
CREATE INDEX "report_files_organizationId_createdAt_idx" ON "public"."report_files"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "report_files_createdById_createdAt_idx" ON "public"."report_files"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "report_files_expiresAt_idx" ON "public"."report_files"("expiresAt");

-- CreateIndex
CREATE INDEX "report_runs_organizationId_requestedAt_idx" ON "public"."report_runs"("organizationId", "requestedAt");

-- CreateIndex
CREATE INDEX "report_runs_requestedById_requestedAt_idx" ON "public"."report_runs"("requestedById", "requestedAt");

-- CreateIndex
CREATE INDEX "report_runs_reportType_requestedAt_idx" ON "public"."report_runs"("reportType", "requestedAt");

-- CreateIndex
CREATE INDEX "report_runs_status_requestedAt_idx" ON "public"."report_runs"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_isRead_createdAt_idx" ON "public"."notifications"("recipientUserId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_organizationId_createdAt_idx" ON "public"."notifications"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "public"."audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_centerId_createdAt_idx" ON "public"."audit_logs"("centerId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_circleId_createdAt_idx" ON "public"."audit_logs"("circleId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "public"."audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "public"."audit_logs"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "public"."audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "library_categories_organization_id_idx" ON "public"."library_categories"("organization_id");

-- CreateIndex
CREATE INDEX "library_categories_center_id_idx" ON "public"."library_categories"("center_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_categories_organization_id_code_key" ON "public"."library_categories"("organization_id", "code");

-- CreateIndex
CREATE INDEX "library_items_organization_id_created_at_idx" ON "public"."library_items"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "library_items_center_id_idx" ON "public"."library_items"("center_id");

-- CreateIndex
CREATE INDEX "library_items_circle_id_idx" ON "public"."library_items"("circle_id");

-- CreateIndex
CREATE INDEX "library_items_category_id_idx" ON "public"."library_items"("category_id");

-- CreateIndex
CREATE INDEX "library_items_status_idx" ON "public"."library_items"("status");

-- CreateIndex
CREATE INDEX "library_items_visibility_idx" ON "public"."library_items"("visibility");

-- CreateIndex
CREATE INDEX "monthly_plans_circle_id_month_year_idx" ON "public"."monthly_plans"("circle_id", "month", "year");

-- CreateIndex
CREATE INDEX "monthly_plans_organization_id_center_id_month_year_idx" ON "public"."monthly_plans"("organization_id", "center_id", "month", "year");

-- CreateIndex
CREATE INDEX "monthly_plans_teacher_id_idx" ON "public"."monthly_plans"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_plans_student_id_circle_id_month_year_key" ON "public"."monthly_plans"("student_id", "circle_id", "month", "year");

-- CreateIndex
CREATE INDEX "group_activities_circle_id_activity_date_idx" ON "public"."group_activities"("circle_id", "activity_date");

-- CreateIndex
CREATE INDEX "group_activities_organization_id_center_id_activity_date_idx" ON "public"."group_activities"("organization_id", "center_id", "activity_date");

-- CreateIndex
CREATE INDEX "group_activities_teacher_id_idx" ON "public"."group_activities"("teacher_id");

-- CreateIndex
CREATE INDEX "group_activity_participants_student_id_idx" ON "public"."group_activity_participants"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_activity_participants_activity_id_student_id_key" ON "public"."group_activity_participants"("activity_id", "student_id");

-- CreateIndex
CREATE INDEX "review_plan_settings_teacher_id_idx" ON "public"."review_plan_settings"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_plan_settings_organization_id_teacher_id_circle_id_key" ON "public"."review_plan_settings"("organization_id", "teacher_id", "circle_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_settings_organizationId_key" ON "public"."finance_settings"("organizationId");

-- CreateIndex
CREATE INDEX "fiscal_years_organizationId_status_idx" ON "public"."fiscal_years"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_years_organizationId_year_key" ON "public"."fiscal_years"("organizationId", "year");

-- CreateIndex
CREATE INDEX "fiscal_periods_organizationId_startDate_endDate_idx" ON "public"."fiscal_periods"("organizationId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "fiscal_periods_organizationId_status_idx" ON "public"."fiscal_periods"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_periods_fiscalYearId_periodNumber_key" ON "public"."fiscal_periods"("fiscalYearId", "periodNumber");

-- CreateIndex
CREATE INDEX "suppliers_organization_id_idx" ON "public"."suppliers"("organization_id");

-- CreateIndex
CREATE INDEX "suppliers_is_active_idx" ON "public"."suppliers"("is_active");

-- CreateIndex
CREATE INDEX "expense_categories_organization_id_idx" ON "public"."expense_categories"("organization_id");

-- CreateIndex
CREATE INDEX "expense_invoices_organization_id_idx" ON "public"."expense_invoices"("organization_id");

-- CreateIndex
CREATE INDEX "expense_invoices_center_id_idx" ON "public"."expense_invoices"("center_id");

-- CreateIndex
CREATE INDEX "expense_invoices_supplier_id_idx" ON "public"."expense_invoices"("supplier_id");

-- CreateIndex
CREATE INDEX "expense_invoices_status_idx" ON "public"."expense_invoices"("status");

-- CreateIndex
CREATE INDEX "expense_payments_organization_id_idx" ON "public"."expense_payments"("organization_id");

-- CreateIndex
CREATE INDEX "expense_payments_invoice_id_idx" ON "public"."expense_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "asset_categories_organization_id_is_active_idx" ON "public"."asset_categories"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "asset_categories_asset_account_id_idx" ON "public"."asset_categories"("asset_account_id");

-- CreateIndex
CREATE INDEX "asset_categories_depreciation_expense_account_id_idx" ON "public"."asset_categories"("depreciation_expense_account_id");

-- CreateIndex
CREATE INDEX "asset_categories_accumulated_depreciation_account_id_idx" ON "public"."asset_categories"("accumulated_depreciation_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_organization_id_name_key" ON "public"."asset_categories"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_acquisition_journal_entry_id_key" ON "public"."fixed_assets"("acquisition_journal_entry_id");

-- CreateIndex
CREATE INDEX "fixed_assets_organization_id_status_idx" ON "public"."fixed_assets"("organization_id", "status");

-- CreateIndex
CREATE INDEX "fixed_assets_center_id_idx" ON "public"."fixed_assets"("center_id");

-- CreateIndex
CREATE INDEX "fixed_assets_category_id_idx" ON "public"."fixed_assets"("category_id");

-- CreateIndex
CREATE INDEX "fixed_assets_custodian_user_id_idx" ON "public"."fixed_assets"("custodian_user_id");

-- CreateIndex
CREATE INDEX "fixed_assets_supplier_id_idx" ON "public"."fixed_assets"("supplier_id");

-- CreateIndex
CREATE INDEX "fixed_assets_expense_invoice_id_idx" ON "public"."fixed_assets"("expense_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_organization_id_asset_code_key" ON "public"."fixed_assets"("organization_id", "asset_code");

-- CreateIndex
CREATE INDEX "asset_custody_logs_organization_id_assigned_at_idx" ON "public"."asset_custody_logs"("organization_id", "assigned_at");

-- CreateIndex
CREATE INDEX "asset_custody_logs_asset_id_assigned_at_idx" ON "public"."asset_custody_logs"("asset_id", "assigned_at");

-- CreateIndex
CREATE INDEX "asset_custody_logs_to_user_id_idx" ON "public"."asset_custody_logs"("to_user_id");

-- CreateIndex
CREATE INDEX "asset_custody_logs_center_id_idx" ON "public"."asset_custody_logs"("center_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_depreciation_entries_journal_entry_id_key" ON "public"."asset_depreciation_entries"("journal_entry_id");

-- CreateIndex
CREATE INDEX "asset_depreciation_entries_organization_id_idx" ON "public"."asset_depreciation_entries"("organization_id");

-- CreateIndex
CREATE INDEX "asset_depreciation_entries_asset_id_idx" ON "public"."asset_depreciation_entries"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_depreciation_entries_asset_id_period_year_period_mont_key" ON "public"."asset_depreciation_entries"("asset_id", "period_year", "period_month");

-- AddForeignKey
ALTER TABLE "public"."centers" ADD CONSTRAINT "centers_center_admin_user_id_fkey" FOREIGN KEY ("center_admin_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."centers" ADD CONSTRAINT "centers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."circles" ADD CONSTRAINT "circles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."circles" ADD CONSTRAINT "circles_primary_teacher_user_id_fkey" FOREIGN KEY ("primary_teacher_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."circle_schedule_slots" ADD CONSTRAINT "circle_schedule_slots_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_settings" ADD CONSTRAINT "remote_recitation_settings_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_settings" ADD CONSTRAINT "remote_recitation_settings_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_slots" ADD CONSTRAINT "remote_recitation_slots_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_slots" ADD CONSTRAINT "remote_recitation_slots_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_slots" ADD CONSTRAINT "remote_recitation_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_bookings" ADD CONSTRAINT "remote_recitation_bookings_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_bookings" ADD CONSTRAINT "remote_recitation_bookings_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_bookings" ADD CONSTRAINT "remote_recitation_bookings_follow_up_record_id_fkey" FOREIGN KEY ("follow_up_record_id") REFERENCES "public"."follow_up_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_bookings" ADD CONSTRAINT "remote_recitation_bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."remote_recitation_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_bookings" ADD CONSTRAINT "remote_recitation_bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_bookings" ADD CONSTRAINT "remote_recitation_bookings_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacher_profiles" ADD CONSTRAINT "teacher_profiles_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacher_profiles" ADD CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_profiles" ADD CONSTRAINT "supervisor_profiles_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_profiles" ADD CONSTRAINT "supervisor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."center_admin_profiles" ADD CONSTRAINT "center_admin_profiles_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."center_admin_profiles" ADD CONSTRAINT "center_admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_profiles" ADD CONSTRAINT "parent_profiles_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_profiles" ADD CONSTRAINT "parent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."center_supervisors" ADD CONSTRAINT "center_supervisors_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."center_supervisors" ADD CONSTRAINT "center_supervisors_supervisor_user_id_fkey" FOREIGN KEY ("supervisor_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_center_accesses" ADD CONSTRAINT "user_center_accesses_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_center_accesses" ADD CONSTRAINT "user_center_accesses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_circle_accesses" ADD CONSTRAINT "user_circle_accesses_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_circle_accesses" ADD CONSTRAINT "user_circle_accesses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_circle_enrollments" ADD CONSTRAINT "student_circle_enrollments_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_circle_enrollments" ADD CONSTRAINT "student_circle_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_student_links" ADD CONSTRAINT "parent_student_links_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_student_links" ADD CONSTRAINT "parent_student_links_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_student_links" ADD CONSTRAINT "parent_student_links_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_marked_by_id_fkey" FOREIGN KEY ("marked_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_excuse_requests" ADD CONSTRAINT "staff_excuse_requests_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_excuse_requests" ADD CONSTRAINT "staff_excuse_requests_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_excuse_requests" ADD CONSTRAINT "staff_excuse_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_excuse_requests" ADD CONSTRAINT "staff_excuse_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_policies" ADD CONSTRAINT "attendance_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_assignments" ADD CONSTRAINT "staff_schedule_assignments_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_assignments" ADD CONSTRAINT "staff_schedule_assignments_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_assignments" ADD CONSTRAINT "staff_schedule_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_assignments" ADD CONSTRAINT "staff_schedule_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_slots" ADD CONSTRAINT "staff_schedule_slots_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."staff_schedule_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_leave_requests" ADD CONSTRAINT "staff_leave_requests_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_leave_requests" ADD CONSTRAINT "staff_leave_requests_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_leave_requests" ADD CONSTRAINT "staff_leave_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_leave_requests" ADD CONSTRAINT "staff_leave_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plans" ADD CONSTRAINT "supervisor_visit_plans_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plans" ADD CONSTRAINT "supervisor_visit_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plans" ADD CONSTRAINT "supervisor_visit_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plans" ADD CONSTRAINT "supervisor_visit_plans_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plan_items" ADD CONSTRAINT "supervisor_visit_plan_items_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plan_items" ADD CONSTRAINT "supervisor_visit_plan_items_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plan_items" ADD CONSTRAINT "supervisor_visit_plan_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."supervisor_visit_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_plan_item_id_fkey" FOREIGN KEY ("plan_item_id") REFERENCES "public"."supervisor_visit_plan_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_rules" ADD CONSTRAINT "finance_deduction_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."finance_deduction_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prayer_time_cache" ADD CONSTRAINT "prayer_time_cache_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_up_records" ADD CONSTRAINT "follow_up_records_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_up_records" ADD CONSTRAINT "follow_up_records_matn_id_fkey" FOREIGN KEY ("matn_id") REFERENCES "public"."matn_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_up_records" ADD CONSTRAINT "follow_up_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_up_records" ADD CONSTRAINT "follow_up_records_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matn_catalogs" ADD CONSTRAINT "matn_catalogs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_notes" ADD CONSTRAINT "supervisor_notes_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_notes" ADD CONSTRAINT "supervisor_notes_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_notes" ADD CONSTRAINT "supervisor_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_notes" ADD CONSTRAINT "supervisor_notes_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."correction_requests" ADD CONSTRAINT "correction_requests_applied_by_id_fkey" FOREIGN KEY ("applied_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."correction_requests" ADD CONSTRAINT "correction_requests_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."correction_requests" ADD CONSTRAINT "correction_requests_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."correction_requests" ADD CONSTRAINT "correction_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."correction_requests" ADD CONSTRAINT "correction_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."correction_requests" ADD CONSTRAINT "correction_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_criteria" ADD CONSTRAINT "exam_criteria_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_nomination_requests" ADD CONSTRAINT "exam_nomination_requests_center_approved_by_id_fkey" FOREIGN KEY ("center_approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_nomination_requests" ADD CONSTRAINT "exam_nomination_requests_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_nomination_requests" ADD CONSTRAINT "exam_nomination_requests_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_nomination_requests" ADD CONSTRAINT "exam_nomination_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_nomination_requests" ADD CONSTRAINT "exam_nomination_requests_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_nomination_requests" ADD CONSTRAINT "exam_nomination_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_nomination_requests" ADD CONSTRAINT "exam_nomination_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_nomination_requests" ADD CONSTRAINT "exam_nomination_requests_supervisor_reviewed_by_id_fkey" FOREIGN KEY ("supervisor_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_evaluated_by_id_fkey" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_evaluation_closed_by_id_fkey" FOREIGN KEY ("evaluation_closed_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_nomination_request_id_fkey" FOREIGN KEY ("nomination_request_id") REFERENCES "public"."exam_nomination_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempt_committee_members" ADD CONSTRAINT "exam_attempt_committee_members_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempt_committee_members" ADD CONSTRAINT "exam_attempt_committee_members_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempt_committee_members" ADD CONSTRAINT "exam_attempt_committee_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempt_questions" ADD CONSTRAINT "exam_attempt_questions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempt_breakdown" ADD CONSTRAINT "exam_attempt_breakdown_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_deferred_by_id_fkey" FOREIGN KEY ("deferred_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_exam_attempt_id_fkey" FOREIGN KEY ("exam_attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."graduation_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_exam_attempt_id_fkey" FOREIGN KEY ("exam_attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_captured_by_id_fkey" FOREIGN KEY ("captured_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_golden_record_id_fkey" FOREIGN KEY ("golden_record_id") REFERENCES "public"."golden_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_grade_scales" ADD CONSTRAINT "exam_grade_scales_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_question_bank_items" ADD CONSTRAINT "exam_question_bank_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_question_bank_items" ADD CONSTRAINT "exam_question_bank_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tuition_plans" ADD CONSTRAINT "tuition_plans_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tuition_plans" ADD CONSTRAINT "tuition_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_tuition_assignments" ADD CONSTRAINT "student_tuition_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_tuition_assignments" ADD CONSTRAINT "student_tuition_assignments_tuitionPlanId_fkey" FOREIGN KEY ("tuitionPlanId") REFERENCES "public"."tuition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_policy_profiles" ADD CONSTRAINT "finance_policy_profiles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_policy_profiles" ADD CONSTRAINT "finance_policy_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_accounts" ADD CONSTRAINT "finance_accounts_accounting_account_id_fkey" FOREIGN KEY ("accounting_account_id") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_accounts" ADD CONSTRAINT "finance_accounts_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_accounts" ADD CONSTRAINT "finance_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_sequences" ADD CONSTRAINT "document_sequences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donors" ADD CONSTRAINT "donors_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donors" ADD CONSTRAINT "donors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donations" ADD CONSTRAINT "donations_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donations" ADD CONSTRAINT "donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "public"."donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donations" ADD CONSTRAINT "donations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donations" ADD CONSTRAINT "donations_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."currencies" ADD CONSTRAINT "currencies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_rates" ADD CONSTRAINT "exchange_rates_organizationId_currencyCode_fkey" FOREIGN KEY ("organizationId", "currencyCode") REFERENCES "public"."currencies"("organizationId", "code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_rates" ADD CONSTRAINT "exchange_rates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_account_movements" ADD CONSTRAINT "finance_account_movements_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_account_movements" ADD CONSTRAINT "finance_account_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_account_movements" ADD CONSTRAINT "finance_account_movements_reversalOfMovementId_fkey" FOREIGN KEY ("reversalOfMovementId") REFERENCES "public"."finance_account_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_account_movements" ADD CONSTRAINT "finance_account_movements_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."finance_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "public"."finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_fromCenterId_fkey" FOREIGN KEY ("fromCenterId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "public"."finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_toCenterId_fkey" FOREIGN KEY ("toCenterId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_voucherInId_fkey" FOREIGN KEY ("voucherInId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_voucherOutId_fkey" FOREIGN KEY ("voucherOutId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."accounting_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "public"."journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_tuitionPlanId_fkey" FOREIGN KEY ("tuitionPlanId") REFERENCES "public"."tuition_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_salaryGradeId_fkey" FOREIGN KEY ("salaryGradeId") REFERENCES "public"."salary_grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_grades" ADD CONSTRAINT "salary_grades_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_grades" ADD CONSTRAINT "salary_grades_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_assignments" ADD CONSTRAINT "staff_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_assignments" ADD CONSTRAINT "staff_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_assignments" ADD CONSTRAINT "staff_assignments_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_assignments" ADD CONSTRAINT "staff_assignments_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_assignments" ADD CONSTRAINT "staff_assignments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_assignments" ADD CONSTRAINT "staff_assignments_endedById_fkey" FOREIGN KEY ("endedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_batches" ADD CONSTRAINT "payroll_batches_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_batches" ADD CONSTRAINT "payroll_batches_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_batches" ADD CONSTRAINT "payroll_batches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."payroll_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_profiles" ADD CONSTRAINT "reward_profiles_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_profiles" ADD CONSTRAINT "reward_profiles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_profiles" ADD CONSTRAINT "reward_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_batches" ADD CONSTRAINT "reward_batches_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_batches" ADD CONSTRAINT "reward_batches_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_batches" ADD CONSTRAINT "reward_batches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."reward_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_files" ADD CONSTRAINT "report_files_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_files" ADD CONSTRAINT "report_files_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_files" ADD CONSTRAINT "report_files_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_files" ADD CONSTRAINT "report_files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_outputFileId_fkey" FOREIGN KEY ("outputFileId") REFERENCES "public"."report_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_categories" ADD CONSTRAINT "library_categories_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_categories" ADD CONSTRAINT "library_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."library_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activities" ADD CONSTRAINT "group_activities_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activities" ADD CONSTRAINT "group_activities_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activities" ADD CONSTRAINT "group_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activities" ADD CONSTRAINT "group_activities_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activity_participants" ADD CONSTRAINT "group_activity_participants_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."group_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activity_participants" ADD CONSTRAINT "group_activity_participants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_plan_settings" ADD CONSTRAINT "review_plan_settings_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_plan_settings" ADD CONSTRAINT "review_plan_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_plan_settings" ADD CONSTRAINT "review_plan_settings_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_settings" ADD CONSTRAINT "finance_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_years" ADD CONSTRAINT "fiscal_years_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_years" ADD CONSTRAINT "fiscal_years_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_periods" ADD CONSTRAINT "fiscal_periods_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."fiscal_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_periods" ADD CONSTRAINT "fiscal_periods_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_periods" ADD CONSTRAINT "fiscal_periods_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."suppliers" ADD CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_categories" ADD CONSTRAINT "expense_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_categories" ADD CONSTRAINT "expense_categories_accounting_account_id_fkey" FOREIGN KEY ("accounting_account_id") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_invoices" ADD CONSTRAINT "expense_invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_invoices" ADD CONSTRAINT "expense_invoices_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_invoices" ADD CONSTRAINT "expense_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_invoices" ADD CONSTRAINT "expense_invoices_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_invoices" ADD CONSTRAINT "expense_invoices_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_payments" ADD CONSTRAINT "expense_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_payments" ADD CONSTRAINT "expense_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."expense_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_payments" ADD CONSTRAINT "expense_payments_finance_account_id_fkey" FOREIGN KEY ("finance_account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_payments" ADD CONSTRAINT "expense_payments_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_payments" ADD CONSTRAINT "expense_payments_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_categories" ADD CONSTRAINT "asset_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_categories" ADD CONSTRAINT "asset_categories_asset_account_id_fkey" FOREIGN KEY ("asset_account_id") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_categories" ADD CONSTRAINT "asset_categories_depreciation_expense_account_id_fkey" FOREIGN KEY ("depreciation_expense_account_id") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_categories" ADD CONSTRAINT "asset_categories_accumulated_depreciation_account_id_fkey" FOREIGN KEY ("accumulated_depreciation_account_id") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixed_assets" ADD CONSTRAINT "fixed_assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixed_assets" ADD CONSTRAINT "fixed_assets_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixed_assets" ADD CONSTRAINT "fixed_assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixed_assets" ADD CONSTRAINT "fixed_assets_custodian_user_id_fkey" FOREIGN KEY ("custodian_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixed_assets" ADD CONSTRAINT "fixed_assets_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixed_assets" ADD CONSTRAINT "fixed_assets_expense_invoice_id_fkey" FOREIGN KEY ("expense_invoice_id") REFERENCES "public"."expense_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixed_assets" ADD CONSTRAINT "fixed_assets_acquisition_journal_entry_id_fkey" FOREIGN KEY ("acquisition_journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_depreciation_entries" ADD CONSTRAINT "asset_depreciation_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_depreciation_entries" ADD CONSTRAINT "asset_depreciation_entries_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_depreciation_entries" ADD CONSTRAINT "asset_depreciation_entries_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
