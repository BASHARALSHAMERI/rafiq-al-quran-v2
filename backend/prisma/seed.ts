import {
  AttemptStatus,
  ActivityType,
  AuditAction,
  AuditEntityType,
  AttendanceStatus,
  CircleType,
  EmploymentStatus,
  InvoiceStatus,
  KhatmType,
  NotificationType,
  ExamStatus,
  ExamQuestionSource,
  ExamType,
  FiscalPeriodStatus,
  FeeMode,
  EnrollmentStatus,
  Gender,
  LibraryItemStatus,
  LibraryVisibility,
  PaymentMethod,
  ParentRelationType,
  ParentProfileRelationType,
  ReportFileKind,
  ReportRunStatus,
  ReportType,
  RiwayaType,
  Prisma,
  PrismaClient,
  Role,
  StudentLevel,
  StudentProfileStatus,
  SupervisorProfileStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedAccountingChart } from "./accounting-chart-seed";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Rafiq@1234";
const LIBRARY_STORAGE_ROOT = path.join(process.cwd(), "storage", "library");
const REPORT_STORAGE_ROOT = path.join(process.cwd(), "storage", "reports");

const dateOnlyDaysAgo = (daysAgo: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
};

const dateTimeDaysAgo = (daysAgo: number, hour = 18): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const seedPdfBuffer = (title: string): Buffer => {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 180] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 56 >>
stream
BT /F1 14 Tf 40 110 Td (${title}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000064 00000 n
0000000121 00000 n
0000000213 00000 n
trailer
<< /Root 1 0 R /Size 5 >>
startxref
308
%%EOF`;

  return Buffer.from(content, "utf8");
};

const createSeedLibraryFile = async (input: {
  organizationId: number;
  centerId?: number | null;
  generatedFileName: string;
  content: Buffer;
}) => {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const centerSegment = input.centerId ? String(input.centerId) : "org";
  const relativeDirectory = path.join(
    String(input.organizationId),
    centerSegment,
    year,
    month
  );
  const absoluteDirectory = path.join(LIBRARY_STORAGE_ROOT, relativeDirectory);
  const absoluteFilePath = path.join(absoluteDirectory, input.generatedFileName);
  const storageKey = path
    .join(relativeDirectory, input.generatedFileName)
    .replace(/\\/g, "/");

  await mkdir(absoluteDirectory, { recursive: true });
  await writeFile(absoluteFilePath, input.content);

  return {
    storageKey,
    fileSize: input.content.length
  };
};

const createSeedReportFile = async (input: {
  organizationId: number;
  reportType: ReportType;
  generatedFileName: string;
  content: Buffer;
}) => {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const relativeDirectory = path.join(
    String(input.organizationId),
    input.reportType.toLowerCase(),
    year,
    month
  );
  const absoluteDirectory = path.join(REPORT_STORAGE_ROOT, relativeDirectory);
  const absoluteFilePath = path.join(absoluteDirectory, input.generatedFileName);
  const storageKey = path
    .join(relativeDirectory, input.generatedFileName)
    .replace(/\\/g, "/");

  await mkdir(absoluteDirectory, { recursive: true });
  await writeFile(absoluteFilePath, input.content);

  return {
    storageKey,
    fileSize: input.content.length
  };
};

async function cleanup() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.reportRun.deleteMany(),
    prisma.reportFile.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.payrollItem.deleteMany(),
    prisma.rewardItem.deleteMany(),
    prisma.payrollBatch.deleteMany(),
    prisma.rewardBatch.deleteMany(),
    prisma.payrollProfile.deleteMany(),
    prisma.rewardProfile.deleteMany(),
    prisma.expensePayment.deleteMany(),
    prisma.financeAccountMovement.deleteMany(),
    prisma.financeVoucher.deleteMany(),
    prisma.financeFundTransfer.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.studentFeeProfile.deleteMany(),
    prisma.financePolicyProfile.deleteMany(),
    prisma.financeAccount.deleteMany(),
    prisma.journalEntryLine.deleteMany(),
    prisma.journalEntry.deleteMany(),
    prisma.fiscalPeriod.deleteMany(),
    prisma.fiscalYear.deleteMany(),
    prisma.studentTuitionAssignment.deleteMany(),
    prisma.tuitionPlan.deleteMany(),
    prisma.libraryItem.deleteMany(),
    prisma.libraryCategory.deleteMany(),
    prisma.examAttemptQuestion.deleteMany(),
    prisma.examAttemptCommitteeMember.deleteMany(),
    prisma.examAttemptBreakdown.deleteMany(),
    prisma.examQuestionBankItem.deleteMany(),
    prisma.examGradeScale.deleteMany(),
    prisma.examAttempt.deleteMany(),
    prisma.examCriteria.deleteMany(),
    prisma.exam.deleteMany(),
    prisma.attendanceRecord.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.teacherProfile.deleteMany(),
    prisma.supervisorProfile.deleteMany(),
    prisma.centerAdminProfile.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.parentProfile.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.parentStudentLink.deleteMany(),
    prisma.studentCircleEnrollment.deleteMany(),
    prisma.userCircleAccess.deleteMany(),
    prisma.userCenterAccess.deleteMany(),
    prisma.parentProfile.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.centerAdminProfile.deleteMany(),
    prisma.supervisorProfile.deleteMany(),
    prisma.teacherProfile.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.centerSupervisor.deleteMany(),
    prisma.circle.deleteMany(),
    prisma.center.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany()
  ]);
}

async function seed() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const organization = await prisma.organization.create({
    data: {
      name: "جمعية رفقاء القرآن",
      code: "RAFIQ"
    }
  });
  await seedAccountingChart(prisma, organization.id);

  await prisma.currency.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: "YER" } },
    update: {},
    create: {
      organizationId: organization.id,
      code: "YER",
      nameAr: "ريال يمني",
      nameEn: "Yemeni Rial",
      symbol: "﷼",
      decimalPlaces: 2,
      isBase: true
    }
  });

  await prisma.financePolicyProfile.create({
    data: {
      organizationId: organization.id,
      feesEnabled: true,
      requireTransferAttachment: true,
      requireApprovalDisbursement: true,
      requireApprovalReceipt: false,
      allowFreeStudents: true,
      allowSymbolicOneTimeFee: true,
      allowOverdraft: false
    }
  });

  const superAdmin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "مشرف النظام العام",
      email: "superadmin@rafiq.local",
      role: Role.SUPER_ADMIN,
      passwordHash
    }
  });

  const centerAdmin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "مدير مركز النور",
      email: "center.admin@rafiq.local",
      role: Role.CENTER_ADMIN,
      createdByUserId: superAdmin.id,
      passwordHash
    }
  });

  const centerAdminSouth = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "مديرة مركز الهدى",
      email: "center.admin.south@rafiq.local",
      role: Role.CENTER_ADMIN,
      createdByUserId: superAdmin.id,
      passwordHash
    }
  });

  const supervisor = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "مشرف أول",
      email: "supervisor@rafiq.local",
      role: Role.SUPERVISOR,
      createdByUserId: superAdmin.id,
      passwordHash
    }
  });

  const teacherNorth = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "المعلم نور",
      email: "teacher.noor@rafiq.local",
      role: Role.TEACHER,
      createdByUserId: superAdmin.id,
      passwordHash
    }
  });

  const teacherSouth = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "المعلمة هدى",
      email: "teacher.huda@rafiq.local",
      role: Role.TEACHER,
      createdByUserId: superAdmin.id,
      passwordHash
    }
  });

  const parent = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "ولي الأمر علي",
      email: "parent@rafiq.local",
      role: Role.PARENT,
      createdByUserId: superAdmin.id,
      passwordHash
    }
  });

  const studentNorth = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "الطالب أحمد",
      email: "student.ahmed@rafiq.local",
      role: Role.STUDENT,
      createdByUserId: superAdmin.id,
      passwordHash
    }
  });

  const studentSouth = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "الطالبة سارة",
      email: "student.sara@rafiq.local",
      role: Role.STUDENT,
      createdByUserId: superAdmin.id,
      passwordHash
    }
  });

  await prisma.userProfile.createMany({
    data: [
      {
        userId: superAdmin.id,
        fullName: superAdmin.fullName,
        gender: Gender.MALE
      },
      {
        userId: centerAdmin.id,
        fullName: centerAdmin.fullName,
        gender: Gender.MALE,
        phone: "0501000001",
        createdByUserId: superAdmin.id
      },
      {
        userId: centerAdminSouth.id,
        fullName: centerAdminSouth.fullName,
        gender: Gender.FEMALE,
        phone: "0501000002",
        createdByUserId: superAdmin.id
      },
      {
        userId: supervisor.id,
        fullName: supervisor.fullName,
        gender: Gender.MALE,
        phone: "0501000003",
        createdByUserId: superAdmin.id
      },
      {
        userId: teacherNorth.id,
        fullName: teacherNorth.fullName,
        gender: Gender.MALE,
        phone: "0501000004",
        createdByUserId: superAdmin.id
      },
      {
        userId: teacherSouth.id,
        fullName: teacherSouth.fullName,
        gender: Gender.FEMALE,
        phone: "0501000005",
        createdByUserId: superAdmin.id
      },
      {
        userId: parent.id,
        fullName: parent.fullName,
        gender: Gender.MALE,
        phone: "0501000006",
        createdByUserId: superAdmin.id
      },
      {
        userId: studentNorth.id,
        fullName: studentNorth.fullName,
        gender: Gender.MALE,
        createdByUserId: superAdmin.id
      },
      {
        userId: studentSouth.id,
        fullName: studentSouth.fullName,
        gender: Gender.FEMALE,
        createdByUserId: superAdmin.id
      }
    ]
  });

  await prisma.centerAdminProfile.createMany({
    data: [
      {
        userId: centerAdmin.id,
        assignedAt: dateOnlyDaysAgo(200),
        employmentStatus: EmploymentStatus.ACTIVE,
        createdByUserId: superAdmin.id
      },
      {
        userId: centerAdminSouth.id,
        assignedAt: dateOnlyDaysAgo(180),
        employmentStatus: EmploymentStatus.ACTIVE,
        createdByUserId: superAdmin.id
      }
    ]
  });

  await prisma.supervisorProfile.create({
    data: {
      userId: supervisor.id,
      assignedAt: dateOnlyDaysAgo(160),
      status: SupervisorProfileStatus.ACTIVE,
      createdByUserId: superAdmin.id
    }
  });

  await prisma.teacherProfile.createMany({
    data: [
      {
        userId: teacherNorth.id,
        hireDate: dateOnlyDaysAgo(400),
        khatmType: KhatmType.HAFIZ,
        riwaya: RiwayaType.HAFS,
        educationLevel: "بكالوريوس شريعة",
        yearsExperience: 5,
        createdByUserId: superAdmin.id
      },
      {
        userId: teacherSouth.id,
        hireDate: dateOnlyDaysAgo(350),
        khatmType: KhatmType.KHATEM,
        riwaya: RiwayaType.HAFS,
        educationLevel: "دبلوم تعليم",
        yearsExperience: 4,
        createdByUserId: superAdmin.id
      }
    ]
  });

  await prisma.studentProfile.createMany({
    data: [
      {
        userId: studentNorth.id,
        nickname: "أبو يحيى",
        level: StudentLevel.INTERMEDIATE,
        studentStatus: StudentProfileStatus.REGULAR,
        joinDate: dateOnlyDaysAgo(120),
        createdByUserId: centerAdmin.id
      },
      {
        userId: studentSouth.id,
        nickname: "سوسو",
        level: StudentLevel.BEGINNER,
        studentStatus: StudentProfileStatus.REGULAR,
        joinDate: dateOnlyDaysAgo(90),
        createdByUserId: centerAdminSouth.id
      }
    ]
  });

  await prisma.parentProfile.create({
    data: {
      userId: parent.id,
      relationType: ParentProfileRelationType.FATHER,
      createdByUserId: centerAdmin.id
    }
  });

  const [centerNorth, centerSouth] = await Promise.all([
    prisma.center.create({
      data: {
        organizationId: organization.id,
        name: "مركز النور",
        gender: Gender.MALE,
        mosqueName: "مسجد الرحمن",
        centerAdminUserId: centerAdmin.id,
        code: "CENTER-NORTH"
      }
    }),
    prisma.center.create({
      data: {
        organizationId: organization.id,
        name: "مركز الهدى",
        gender: Gender.FEMALE,
        mosqueName: "مسجد السلام",
        centerAdminUserId: centerAdminSouth.id,
        code: "CENTER-SOUTH"
      }
    })
  ]);

  const circleNoor = await prisma.circle.create({
    data: {
      centerId: centerNorth.id,
      name: "حلقة النور",
      gender: Gender.MALE,
      circleType: CircleType.HIFZ,
      teacherId: teacherNorth.id,
      mosqueName: "قاعة 1 - مسجد الرحمن"
    }
  });

  const circleHuda = await prisma.circle.create({
    data: {
      centerId: centerSouth.id,
      name: "حلقة الهدى",
      gender: Gender.FEMALE,
      circleType: CircleType.REVIEW,
      teacherId: teacherSouth.id,
      mosqueName: "قاعة البنات - مسجد السلام"
    }
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const previousMonthDate = new Date(currentYear, currentMonth - 2, 1);
  const previousMonth = previousMonthDate.getMonth() + 1;
  const previousYear = previousMonthDate.getFullYear();
  const fiscalYearStart = new Date(currentYear, 0, 1);
  const currentIssuedAt = new Date(currentYear, currentMonth - 1, 1);
  const previousIssuedAt = new Date(previousYear, previousMonth - 1, 1);

  const [northTuitionPlan, southTuitionPlan] = await Promise.all([
    prisma.tuitionPlan.create({
      data: {
        organizationId: organization.id,
        centerId: centerNorth.id,
        name: "الرسوم الشهرية العامة - مركز النور",
        monthlyAmount: 5000,
        isActive: true
      }
    }),
    prisma.tuitionPlan.create({
      data: {
        organizationId: organization.id,
        centerId: centerSouth.id,
        name: "الرسوم الشهرية العامة - مركز الهدى",
        monthlyAmount: 5000,
        isActive: true
      }
    })
  ]);

  await prisma.studentTuitionAssignment.createMany({
    data: [
      {
        studentId: studentNorth.id,
        tuitionPlanId: northTuitionPlan.id,
        startDate: currentIssuedAt,
        status: "ACTIVE"
      },
      {
        studentId: studentSouth.id,
        tuitionPlanId: southTuitionPlan.id,
        startDate: currentIssuedAt,
        status: "ACTIVE"
      }
    ],
    skipDuplicates: true
  });

  await prisma.studentFeeProfile.createMany({
    data: [
      {
        organizationId: organization.id,
        centerId: centerNorth.id,
        studentId: studentNorth.id,
        feeMode: FeeMode.PLAN_MONTHLY,
        tuitionPlanId: northTuitionPlan.id,
        isActive: true,
        startDate: fiscalYearStart
      },
      {
        organizationId: organization.id,
        centerId: centerSouth.id,
        studentId: studentSouth.id,
        feeMode: FeeMode.PLAN_MONTHLY,
        tuitionPlanId: southTuitionPlan.id,
        isActive: true,
        startDate: fiscalYearStart
      }
    ],
    skipDuplicates: true
  });

  // Seed fiscal years and periods (2025-2030) to support smoke test retries across years
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  for (let year = 2025; year <= 2030; year++) {
    const fy = await prisma.fiscalYear.upsert({
      where: { organizationId_year: { organizationId: organization.id, year } },
      update: { startDate: new Date(year, 0, 1), endDate: new Date(year, 11, 31), status: FiscalPeriodStatus.OPEN },
      create: {
        organizationId: organization.id,
        year,
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31),
        status: FiscalPeriodStatus.OPEN
      }
    });
    for (let m = 0; m < 12; m++) {
      const pStart = new Date(year, m, 1);
      const pEnd = new Date(year, m + 1, 0);
      await prisma.fiscalPeriod.upsert({
        where: {
          fiscalYearId_periodNumber: { fiscalYearId: fy.id, periodNumber: m + 1 }
        },
        update: { startDate: pStart, endDate: pEnd, status: FiscalPeriodStatus.OPEN },
        create: {
          fiscalYearId: fy.id,
          organizationId: organization.id,
          periodNumber: m + 1,
          periodName: arabicMonths[m],
          startDate: pStart,
          endDate: pEnd,
          status: FiscalPeriodStatus.OPEN
        }
      });
    }
  }

  const upsertInvoice = (input: {
    studentId: number;
    centerId: number;
    month: number;
    year: number;
    amount: number;
    issuedAt: Date;
  }) => {
    return prisma.invoice.upsert({
      where: {
        studentId_month_year_invoiceType: {
          studentId: input.studentId,
          month: input.month,
          year: input.year,
          invoiceType: "TUITION_MONTHLY"
        }
      },
      update: {
        centerId: input.centerId,
        amount: input.amount,
        issuedAt: input.issuedAt
      },
      create: {
        studentId: input.studentId,
        centerId: input.centerId,
        month: input.month,
        year: input.year,
        amount: input.amount,
        issuedAt: input.issuedAt
      }
    });
  };

  const [invoiceNorthCurrent, invoiceNorthPrevious, invoiceSouthCurrent, invoiceSouthPrevious] =
    await Promise.all([
      upsertInvoice({
        studentId: studentNorth.id,
        centerId: centerNorth.id,
        month: currentMonth,
        year: currentYear,
        amount: 5000,
        issuedAt: currentIssuedAt
      }),
      upsertInvoice({
        studentId: studentNorth.id,
        centerId: centerNorth.id,
        month: previousMonth,
        year: previousYear,
        amount: 5000,
        issuedAt: previousIssuedAt
      }),
      upsertInvoice({
        studentId: studentSouth.id,
        centerId: centerSouth.id,
        month: currentMonth,
        year: currentYear,
        amount: 5000,
        issuedAt: currentIssuedAt
      }),
      upsertInvoice({
        studentId: studentSouth.id,
        centerId: centerSouth.id,
        month: previousMonth,
        year: previousYear,
        amount: 5000,
        issuedAt: previousIssuedAt
      })
    ]);

  const existingPartialPayment = await prisma.payment.findFirst({
    where: {
      invoiceId: invoiceNorthCurrent.id,
      amount: 2500,
      method: PaymentMethod.CASH,
      receivedById: centerAdmin.id
    },
    select: {
      id: true
    }
  });

  if (!existingPartialPayment) {
    await prisma.payment.create({
      data: {
        invoiceId: invoiceNorthCurrent.id,
        amount: 2500,
        method: PaymentMethod.CASH,
        receivedById: centerAdmin.id,
        receivedAt: new Date(currentYear, currentMonth - 1, 10, 11, 0, 0),
        centerId: centerNorth.id,
        organizationId: organization.id
      }
    });
  }

  const seededInvoices = [
    invoiceNorthCurrent,
    invoiceNorthPrevious,
    invoiceSouthCurrent,
    invoiceSouthPrevious
  ];

  for (const invoice of seededInvoices) {
    const paidAggregate = await prisma.payment.aggregate({
      where: {
        invoiceId: invoice.id
      },
      _sum: {
        amount: true
      }
    });

    const totalPaid = Number(paidAggregate._sum.amount ?? 0);
    const status =
      totalPaid >= Number(invoice.amount)
        ? InvoiceStatus.PAID
        : totalPaid > 0
          ? InvoiceStatus.PARTIAL
          : InvoiceStatus.PENDING;

    await prisma.invoice.update({
      where: {
        id: invoice.id
      },
      data: {
        status
      }
    });
  }

  const [globalCategory, northCategory, southCategory] = await Promise.all([
    prisma.libraryCategory.create({
      data: {
        organizationId: organization.id,
        name: "المكتبة العامة",
        code: "LIB-GLOBAL"
      }
    }),
    prisma.libraryCategory.create({
      data: {
        organizationId: organization.id,
        centerId: centerNorth.id,
        name: "مواد مركز النور",
        code: "LIB-NORTH"
      }
    }),
    prisma.libraryCategory.create({
      data: {
        organizationId: organization.id,
        centerId: centerSouth.id,
        name: "مواد مركز الهدى",
        code: "LIB-SOUTH"
      }
    })
  ]);

  const orgFile = await createSeedLibraryFile({
    organizationId: organization.id,
    generatedFileName: "seed-org-guidelines.pdf",
    content: seedPdfBuffer("دليل المكتبة المؤسسي")
  });

  const northCenterFile = await createSeedLibraryFile({
    organizationId: organization.id,
    centerId: centerNorth.id,
    generatedFileName: "seed-center-north-reference.pdf",
    content: seedPdfBuffer("مرجع مركز النور")
  });

  const northCircleFile = await createSeedLibraryFile({
    organizationId: organization.id,
    centerId: centerNorth.id,
    generatedFileName: "seed-circle-noor-memorization.pdf",
    content: seedPdfBuffer("ورقة حفظ حلقة النور")
  });

  const southCircleFile = await createSeedLibraryFile({
    organizationId: organization.id,
    centerId: centerSouth.id,
    generatedFileName: "seed-circle-huda-review.pdf",
    content: seedPdfBuffer("ورقة مراجعة حلقة الهدى")
  });

  await prisma.libraryItem.createMany({
    data: [
      {
        organizationId: organization.id,
        title: "دليل المكتبة المؤسسي",
        description: "مرجع عام لجميع المستخدمين في الجمعية",
        fileName: "organization-guidelines.pdf",
        mimeType: "application/pdf",
        fileSize: orgFile.fileSize,
        storageKey: orgFile.storageKey,
        visibility: LibraryVisibility.ORG,
        status: LibraryItemStatus.ACTIVE,
        categoryId: globalCategory.id,
        createdById: superAdmin.id
      },
      {
        organizationId: organization.id,
        centerId: centerNorth.id,
        title: "مرجع مركز النور",
        description: "ملف تعليمي على مستوى المركز",
        fileName: "north-center-reference.pdf",
        mimeType: "application/pdf",
        fileSize: northCenterFile.fileSize,
        storageKey: northCenterFile.storageKey,
        visibility: LibraryVisibility.CENTER,
        status: LibraryItemStatus.ACTIVE,
        categoryId: northCategory.id,
        createdById: centerAdmin.id
      },
      {
        organizationId: organization.id,
        centerId: centerNorth.id,
        circleId: circleNoor.id,
        title: "واجب حلقة النور",
        description: "مادة خاصة بطلاب حلقة النور",
        fileName: "noor-circle-memorization.pdf",
        mimeType: "application/pdf",
        fileSize: northCircleFile.fileSize,
        storageKey: northCircleFile.storageKey,
        visibility: LibraryVisibility.CIRCLE,
        status: LibraryItemStatus.ACTIVE,
        categoryId: northCategory.id,
        createdById: teacherNorth.id
      },
      {
        organizationId: organization.id,
        centerId: centerSouth.id,
        circleId: circleHuda.id,
        title: "ورقة مراجعة حلقة الهدى",
        description: "مادة خاصة بطلاب حلقة الهدى",
        fileName: "huda-circle-review.pdf",
        mimeType: "application/pdf",
        fileSize: southCircleFile.fileSize,
        storageKey: southCircleFile.storageKey,
        visibility: LibraryVisibility.CIRCLE,
        status: LibraryItemStatus.ACTIVE,
        categoryId: southCategory.id,
        createdById: teacherSouth.id
      }
    ]
  });
  await prisma.examGradeScale.createMany({
    data: [
      {
        organizationId: organization.id,
        label: "ممتاز",
        minPercentage: 95,
        maxPercentage: 100,
        color: "#15803d",
        sortOrder: 1,
        isActive: true
      },
      {
        organizationId: organization.id,
        label: "جيد جدًا",
        minPercentage: 85,
        maxPercentage: 94.99,
        color: "#0f766e",
        sortOrder: 2,
        isActive: true
      },
      {
        organizationId: organization.id,
        label: "جيد",
        minPercentage: 75,
        maxPercentage: 84.99,
        color: "#0284c7",
        sortOrder: 3,
        isActive: true
      },
      {
        organizationId: organization.id,
        label: "مقبول",
        minPercentage: 60,
        maxPercentage: 74.99,
        color: "#ea580c",
        sortOrder: 4,
        isActive: true
      },
      {
        organizationId: organization.id,
        label: "يحتاج متابعة",
        minPercentage: 0,
        maxPercentage: 59.99,
        color: "#dc2626",
        sortOrder: 5,
        isActive: true
      }
    ]
  });

  await prisma.examQuestionBankItem.createMany({
    data: [
      {
        organizationId: organization.id,
        fromSurah: 78,
        fromAyah: 1,
        toSurah: 78,
        toAyah: 16,
        suggestedText: "افتتاح جزء عم",
        source: ExamQuestionSource.MANUAL,
        createdById: superAdmin.id,
        pageNumber: 582,
        lineCount: 5,
        difficultyLevel: 2
      },
      {
        organizationId: organization.id,
        fromSurah: 67,
        fromAyah: 1,
        toSurah: 67,
        toAyah: 12,
        suggestedText: "مراجعة من أول سورة الملك",
        source: ExamQuestionSource.MANUAL,
        createdById: superAdmin.id,
        pageNumber: 562,
        lineCount: 5,
        difficultyLevel: 3
      },
      {
        organizationId: organization.id,
        fromSurah: 2,
        fromAyah: 1,
        toSurah: 2,
        toAyah: 20,
        suggestedText: "افتتاح الجزء الأول",
        source: ExamQuestionSource.AUTO,
        createdById: superAdmin.id,
        pageNumber: 2,
        lineCount: 8,
        difficultyLevel: 4
      },
      {
        organizationId: organization.id,
        fromSurah: 112,
        fromAyah: 1,
        toSurah: 114,
        toAyah: 6,
        suggestedText: "سور الإخلاص والمعوذتين",
        source: ExamQuestionSource.AUTO,
        createdById: superAdmin.id,
        pageNumber: 604,
        lineCount: 4,
        difficultyLevel: 1
      }
    ]
  });

  const juzLabels = [
    "الجزء الأول", "الجزء الثاني", "الجزء الثالث", "الجزء الرابع", "الجزء الخامس",
    "الجزء السادس", "الجزء السابع", "الجزء الثامن", "الجزء التاسع", "الجزء العاشر",
    "الجزء الحادي عشر", "الجزء الثاني عشر", "الجزء الثالث عشر", "الجزء الرابع عشر",
    "الجزء الخامس عشر", "الجزء السادس عشر", "الجزء السابع عشر", "الجزء الثامن عشر",
    "الجزء التاسع عشر", "الجزء العشرون", "الجزء الحادي والعشرون", "الجزء الثاني والعشرون",
    "الجزء الثالث والعشرون", "الجزء الرابع والعشرون", "الجزء الخامس والعشرون",
    "الجزء السادس والعشرون", "الجزء السابع والعشرون", "الجزء الثامن والعشرون",
    "الجزء التاسع والعشرون", "الجزء الثلاثون"
  ] as const;

  const juzExams = await Promise.all(
    juzLabels.map((label) =>
      prisma.exam.create({
        data: {
          organizationId: organization.id,
          centerId: null,
          circleId: null,
          title: `اختبار ${label}`,
          type: ExamType.JUZ,
          examBranch: label,
          maxScore: 100,
          passScore: 70,
          status: ExamStatus.PUBLISHED,
          createdById: superAdmin.id
        }
      })
    )
  );

  const examNorth = juzExams[29];

  const examSouth = await prisma.exam.create({
    data: {
      organizationId: organization.id,
      centerId: null,
      circleId: null,
      title: "اختبار المصحف كاملاً",
      type: ExamType.FULL_QURAN,
      examBranch: null,
      maxScore: 100,
      passScore: 80,
      status: ExamStatus.PUBLISHED,
      createdById: superAdmin.id
    }
  });

  await prisma.examCriteria.createMany({
    data: [
      ...juzExams.map((exam) => ({
        examId: exam.id,
        memorizationScore: 60,
        tajweedScore: 20,
        theoreticalTajweedScore: 10,
        performanceScore: 10,
        promptingPenalty: 1,
        remindingPenalty: 1,
        tajweedPenalty: 1
      })),
      {
        examId: examSouth.id,
        memorizationScore: 65,
        tajweedScore: 15,
        theoreticalTajweedScore: 10,
        performanceScore: 10,
        promptingPenalty: 1,
        remindingPenalty: 1,
        tajweedPenalty: 1
      }
    ],
    skipDuplicates: true
  });

  const attemptNorth = await prisma.examAttempt.create({
    data: {
      examId: examNorth.id,
      studentId: studentNorth.id,
      circleId: circleNoor.id,
      examDate: dateOnlyDaysAgo(2),
      committeeNotes: "نتيجة جيدة مع ملاحظات بسيطة",
      totalScore: 88,
      gradeLabel: "جيد جدًا",
      status: AttemptStatus.APPROVED,
      startedAt: dateTimeDaysAgo(2, 17),
      submittedAt: dateTimeDaysAgo(2, 18),
      reviewedAt: dateTimeDaysAgo(2, 18),
      evaluatedById: teacherNorth.id
    }
  });

  const attemptSouth = await prisma.examAttempt.create({
    data: {
      examId: examSouth.id,
      studentId: studentSouth.id,
      circleId: circleHuda.id,
      examDate: dateOnlyDaysAgo(-4),
      fullQuranCompletedAt: dateOnlyDaysAgo(25),
      committeeNotes: "محاولة مجدولة بانتظار التنفيذ",
      status: AttemptStatus.SCHEDULED
    }
  });

  const attemptNorthScheduled = await prisma.examAttempt.create({
    data: {
      examId: examNorth.id,
      studentId: studentNorth.id,
      circleId: circleNoor.id,
      examDate: dateOnlyDaysAgo(-2),
      committeeNotes: "محاولة مجدولة جديدة لتجربة توليد الأسئلة يدويًا",
      status: AttemptStatus.SCHEDULED
    }
  });

  await prisma.examAttemptCommitteeMember.createMany({
    data: [
      {
        attemptId: attemptNorth.id,
        userId: teacherNorth.id,
        assignedById: centerAdmin.id,
        roleAtAssignment: Role.TEACHER
      },
      {
        attemptId: attemptNorth.id,
        userId: supervisor.id,
        assignedById: centerAdmin.id,
        roleAtAssignment: Role.SUPERVISOR
      },
      {
        attemptId: attemptSouth.id,
        userId: teacherSouth.id,
        assignedById: centerAdminSouth.id,
        roleAtAssignment: Role.TEACHER
      },
      {
        attemptId: attemptSouth.id,
        userId: supervisor.id,
        assignedById: centerAdminSouth.id,
        roleAtAssignment: Role.SUPERVISOR
      },
      {
        attemptId: attemptNorthScheduled.id,
        userId: teacherNorth.id,
        assignedById: centerAdmin.id,
        roleAtAssignment: Role.TEACHER
      },
      {
        attemptId: attemptNorthScheduled.id,
        userId: supervisor.id,
        assignedById: centerAdmin.id,
        roleAtAssignment: Role.SUPERVISOR
      }
    ],
    skipDuplicates: true
  });

  await prisma.examAttemptQuestion.createMany({
    data: [
      {
        attemptId: attemptNorth.id,
        orderIndex: 1,
        source: ExamQuestionSource.AUTO,
        fromSurah: 78,
        fromAyah: 1,
        toSurah: 78,
        toAyah: 16,
        promptingDeductions: 1,
        remindingDeductions: 0,
        tajweedDeductions: 0,
        isEvaluated: true
      },
      {
        attemptId: attemptNorth.id,
        orderIndex: 2,
        source: ExamQuestionSource.AUTO,
        fromSurah: 81,
        fromAyah: 1,
        toSurah: 81,
        toAyah: 14,
        promptingDeductions: 0,
        remindingDeductions: 1,
        tajweedDeductions: 1,
        isEvaluated: true
      }
    ],
    skipDuplicates: true
  });

  await prisma.examAttemptBreakdown.createMany({
    data: [
      {
        attemptId: attemptNorth.id,
        memorizationScore: 58,
        tajweedScore: 16,
        theoreticalTajweedScore: 8,
        performanceScore: 9,
        promptingDeductions: 1,
        remindingDeductions: 1,
        tajweedDeductions: 1
      }
    ],
    skipDuplicates: true
  });

  await prisma.userCenterAccess.createMany({
    data: [
      { userId: centerAdmin.id, centerId: centerNorth.id },
      { userId: centerAdminSouth.id, centerId: centerSouth.id },
      { userId: supervisor.id, centerId: centerNorth.id },
      { userId: supervisor.id, centerId: centerSouth.id },
      { userId: teacherNorth.id, centerId: centerNorth.id },
      { userId: teacherSouth.id, centerId: centerSouth.id }
    ],
    skipDuplicates: true
  });

  await prisma.centerSupervisor.createMany({
    data: [
      { centerId: centerNorth.id, supervisorUserId: supervisor.id, isActive: true },
      { centerId: centerSouth.id, supervisorUserId: supervisor.id, isActive: true }
    ],
    skipDuplicates: true
  });

  await prisma.userCircleAccess.createMany({
    data: [
      { userId: supervisor.id, circleId: circleHuda.id },
      { userId: teacherNorth.id, circleId: circleNoor.id },
      { userId: teacherSouth.id, circleId: circleHuda.id }
    ],
    skipDuplicates: true
  });

  await prisma.studentCircleEnrollment.createMany({
    data: [
      {
        studentId: studentNorth.id,
        circleId: circleNoor.id,
        status: EnrollmentStatus.ACTIVE
      },
      {
        studentId: studentSouth.id,
        circleId: circleHuda.id,
        status: EnrollmentStatus.ACTIVE
      }
    ],
    skipDuplicates: true
  });

  await prisma.parentStudentLink.createMany({
    data: [
      {
        parentId: parent.id,
        studentId: studentNorth.id,
        relationType: ParentRelationType.FATHER,
        createdByUserId: centerAdmin.id
      },
      {
        parentId: parent.id,
        studentId: studentSouth.id,
        relationType: ParentRelationType.FATHER,
        createdByUserId: centerAdminSouth.id
      }
    ],
    skipDuplicates: true
  });

  await prisma.attendanceRecord.createMany({
    data: [
      {
        studentId: studentNorth.id,
        circleId: circleNoor.id,
        attendanceDate: dateOnlyDaysAgo(1),
        status: AttendanceStatus.PRESENT,
        markedById: teacherNorth.id
      },
      {
        studentId: studentNorth.id,
        circleId: circleNoor.id,
        attendanceDate: dateOnlyDaysAgo(2),
        status: AttendanceStatus.LATE,
        markedById: teacherNorth.id
      },
      {
        studentId: studentNorth.id,
        circleId: circleNoor.id,
        attendanceDate: dateOnlyDaysAgo(3),
        status: AttendanceStatus.ABSENT,
        markedById: teacherNorth.id
      },
      {
        studentId: studentSouth.id,
        circleId: circleHuda.id,
        attendanceDate: dateOnlyDaysAgo(1),
        status: AttendanceStatus.PRESENT,
        markedById: teacherSouth.id
      },
      {
        studentId: studentSouth.id,
        circleId: circleHuda.id,
        attendanceDate: dateOnlyDaysAgo(2),
        status: AttendanceStatus.PRESENT,
        markedById: teacherSouth.id
      },
      {
        studentId: studentSouth.id,
        circleId: circleHuda.id,
        attendanceDate: dateOnlyDaysAgo(3),
        status: AttendanceStatus.EXCUSED,
        markedById: teacherSouth.id
      }
    ],
    skipDuplicates: true
  });

  await prisma.activityLog.createMany({
    data: [
      {
        organizationId: organization.id,
        userId: superAdmin.id,
        activityType: ActivityType.USER_CREATED,
        entityType: "seed",
        message: "تم تهيئة بيانات البذرة"
      },
      {
        organizationId: organization.id,
        userId: centerAdmin.id,
        centerId: centerNorth.id,
        activityType: ActivityType.GENERIC,
        entityType: "center",
        entityId: centerNorth.id,
        message: "تعيين مدير مركز لمركز النور"
      },
      {
        organizationId: organization.id,
        userId: supervisor.id,
        centerId: centerSouth.id,
        circleId: circleHuda.id,
        activityType: ActivityType.GENERIC,
        entityType: "circle",
        entityId: circleHuda.id,
        message: "تعيين مشرف لحلقة الهدى"
      },
      {
        organizationId: organization.id,
        userId: teacherNorth.id,
        centerId: centerNorth.id,
        circleId: circleNoor.id,
        activityType: ActivityType.ATTENDANCE_MARKED,
        entityType: "attendance",
        message: "قام المعلم نور بتسجيل حضور حلقة النور"
      },
      {
        organizationId: organization.id,
        userId: teacherSouth.id,
        centerId: centerSouth.id,
        circleId: circleHuda.id,
        activityType: ActivityType.ATTENDANCE_MARKED,
        entityType: "attendance",
        message: "قامت المعلمة هدى بتسجيل حضور حلقة الهدى"
      }
    ]
  });

  const attendanceExportSeed = await createSeedReportFile({
    organizationId: organization.id,
    reportType: ReportType.ATTENDANCE,
    generatedFileName: "seed-attendance-report.pdf",
    content: seedPdfBuffer("تقرير حضور تجريبي")
  });

  const financeExportSeed = await createSeedReportFile({
    organizationId: organization.id,
    reportType: ReportType.FINANCE,
    generatedFileName: "seed-finance-report.pdf",
    content: seedPdfBuffer("تقرير مالي تجريبي")
  });

  const attendanceReportFile = await prisma.reportFile.create({
    data: {
      organizationId: organization.id,
      centerId: centerNorth.id,
      circleId: circleNoor.id,
      name: "تقرير-حضور-تجريبي.pdf",
      mimeType: "application/pdf",
      sizeBytes: attendanceExportSeed.fileSize,
      storageKey: attendanceExportSeed.storageKey,
      kind: ReportFileKind.PDF,
      createdById: superAdmin.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  const financeReportFile = await prisma.reportFile.create({
    data: {
      organizationId: organization.id,
      centerId: centerNorth.id,
      name: "تقرير-مالي-تجريبي.pdf",
      mimeType: "application/pdf",
      sizeBytes: financeExportSeed.fileSize,
      storageKey: financeExportSeed.storageKey,
      kind: ReportFileKind.PDF,
      createdById: centerAdmin.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.reportRun.createMany({
    data: [
      {
        organizationId: organization.id,
        centerId: centerNorth.id,
        circleId: circleNoor.id,
        reportType: ReportType.ATTENDANCE,
        status: ReportRunStatus.COMPLETED,
        requestedById: superAdmin.id,
        requestedAt: dateTimeDaysAgo(1, 10),
        completedAt: dateTimeDaysAgo(1, 10),
        filters: {
          from: dateOnlyDaysAgo(7).toISOString(),
          to: dateOnlyDaysAgo(0).toISOString(),
          centerId: centerNorth.id,
          circleId: circleNoor.id
        },
        summary: {
          totalRecords: 3
        },
        outputFileId: attendanceReportFile.id
      },
      {
        organizationId: organization.id,
        centerId: centerNorth.id,
        reportType: ReportType.FINANCE,
        status: ReportRunStatus.COMPLETED,
        requestedById: centerAdmin.id,
        requestedAt: dateTimeDaysAgo(1, 11),
        completedAt: dateTimeDaysAgo(1, 11),
        filters: {
          from: dateOnlyDaysAgo(30).toISOString(),
          to: dateOnlyDaysAgo(0).toISOString(),
          centerId: centerNorth.id
        },
        summary: {
          totalInvoices: 2
        },
        outputFileId: financeReportFile.id
      },
      {
        organizationId: organization.id,
        centerId: centerSouth.id,
        circleId: circleHuda.id,
        reportType: ReportType.EXAMS,
        status: ReportRunStatus.FAILED,
        requestedById: supervisor.id,
        requestedAt: dateTimeDaysAgo(2, 9),
        completedAt: dateTimeDaysAgo(2, 9),
        filters: {
          from: dateOnlyDaysAgo(14).toISOString(),
          to: dateOnlyDaysAgo(0).toISOString(),
          centerId: centerSouth.id,
          circleId: circleHuda.id
        },
        errorMessage: "فشل تجريبي محاكى"
      }
    ]
  });

  const notificationSeeds: Array<{
    organizationId: number;
    centerId?: number | null;
    circleId?: number | null;
    type: NotificationType;
    title: string;
    body: string;
    payload: Prisma.InputJsonValue;
    recipientUserId: number;
    isRead: boolean;
    createdById?: number | null;
    createdAt: Date;
    readAt?: Date | null;
  }> = [
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      circleId: circleNoor.id,
      type: NotificationType.EXAM_PUBLISHED,
      title: "نشر اختبار لحلقة النور",
      body: "تم إتاحة اختبار جديد منشور لحلقة النور.",
      payload: {
        examId: examNorth.id,
        centerId: centerNorth.id,
        circleId: circleNoor.id
      },
      recipientUserId: superAdmin.id,
      isRead: false,
      createdById: supervisor.id,
      createdAt: dateTimeDaysAgo(2, 12)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      type: NotificationType.REPORT_EXPORTED,
      title: "تصدير تقرير الحضور",
      body: "ملف تصدير الحضور جاهز للتنزيل.",
      payload: {
        reportFileId: attendanceReportFile.id,
        reportType: "ATTENDANCE",
        centerId: centerNorth.id
      },
      recipientUserId: superAdmin.id,
      isRead: true,
      createdById: superAdmin.id,
      createdAt: dateTimeDaysAgo(1, 11),
      readAt: dateTimeDaysAgo(1, 12)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      type: NotificationType.INVOICE_ISSUED,
      title: "إصدار فاتورة شهرية",
      body: "تم إصدار فاتورة شهرية جديدة لالطالب أحمد.",
      payload: {
        invoiceId: invoiceNorthCurrent.id,
        studentId: studentNorth.id,
        centerId: centerNorth.id
      },
      recipientUserId: centerAdmin.id,
      isRead: false,
      createdById: centerAdmin.id,
      createdAt: dateTimeDaysAgo(1, 9)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      type: NotificationType.PAYMENT_RECORDED,
      title: "تسجيل دفعة",
      body: "تم تسجيل دفعة على الفاتورة الحالية.",
      payload: {
        invoiceId: invoiceNorthCurrent.id,
        studentId: studentNorth.id,
        amount: 2500
      },
      recipientUserId: centerAdmin.id,
      isRead: true,
      createdById: centerAdmin.id,
      createdAt: dateTimeDaysAgo(1, 8),
      readAt: dateTimeDaysAgo(1, 9)
    },
    {
      organizationId: organization.id,
      centerId: centerSouth.id,
      circleId: circleHuda.id,
      type: NotificationType.EXAM_PUBLISHED,
      title: "تحديد موعد اختبار حلقة الهدى",
      body: "تم تحديد موعد اختبار الطالبة سارة بانتظار توليد الأسئلة وإجراء الاختبار.",
      payload: {
        examId: examSouth.id,
        attemptId: attemptSouth.id,
        studentId: studentSouth.id,
        circleId: circleHuda.id
      },
      recipientUserId: supervisor.id,
      isRead: false,
      createdById: teacherSouth.id,
      createdAt: dateTimeDaysAgo(1, 13)
    },
    {
      organizationId: organization.id,
      centerId: centerSouth.id,
      circleId: circleHuda.id,
      type: NotificationType.LIBRARY_UPLOADED,
      title: "رفع مادة للحلقة",
      body: "تم رفع ورقة مراجعة جديدة لحلقة الهدى.",
      payload: {
        libraryItemTitle: "ورقة مراجعة حلقة الهدى",
        circleId: circleHuda.id,
        centerId: centerSouth.id
      },
      recipientUserId: supervisor.id,
      isRead: false,
      createdById: teacherSouth.id,
      createdAt: dateTimeDaysAgo(1, 14)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      circleId: circleNoor.id,
      type: NotificationType.EXAM_PUBLISHED,
      title: "الإعلان عن موعد اختبار حلقة النور",
      body: "تم الإعلان عن موعد اختبار حلقة النور.",
      payload: {
        examId: examNorth.id,
        circleId: circleNoor.id,
        centerId: centerNorth.id
      },
      recipientUserId: teacherNorth.id,
      isRead: false,
      createdById: supervisor.id,
      createdAt: dateTimeDaysAgo(2, 10)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      circleId: circleNoor.id,
      type: NotificationType.EXAM_SCORED,
      title: "مراجعة محاولة اختبار أحمد",
      body: "تمت مراجعة محاولة اختبار أحمد.",
      payload: {
        examId: examNorth.id,
        attemptId: attemptNorth.id,
        studentId: studentNorth.id,
        circleId: circleNoor.id
      },
      recipientUserId: teacherNorth.id,
      isRead: true,
      createdById: supervisor.id,
      createdAt: dateTimeDaysAgo(2, 9),
      readAt: dateTimeDaysAgo(2, 9)
    },
    {
      organizationId: organization.id,
      centerId: centerSouth.id,
      circleId: circleHuda.id,
      type: NotificationType.LIBRARY_UPLOADED,
      title: "رفع مورد مراجعة لحلقة الهدى",
      body: "أصبح مورد مراجعة جديد متاحًا لحلقتك.",
      payload: {
        studentId: studentSouth.id,
        circleId: circleHuda.id,
        centerId: centerSouth.id
      },
      recipientUserId: teacherSouth.id,
      isRead: false,
      createdById: teacherSouth.id,
      createdAt: dateTimeDaysAgo(1, 15)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      type: NotificationType.INVOICE_ISSUED,
      title: "إصدار فاتورة أحمد",
      body: "تم إصدار فاتورة جديدة لابنك أحمد.",
      payload: {
        invoiceId: invoiceNorthCurrent.id,
        studentId: studentNorth.id,
        studentIds: [studentNorth.id]
      },
      recipientUserId: parent.id,
      isRead: false,
      createdById: centerAdmin.id,
      createdAt: dateTimeDaysAgo(1, 7)
    },
    {
      organizationId: organization.id,
      centerId: centerSouth.id,
      circleId: circleHuda.id,
      type: NotificationType.EXAM_PUBLISHED,
      title: "موعد اختبار سارة",
      body: "تم تحديد موعد اختبار جديد لابنتك سارة.",
      payload: {
        examId: examSouth.id,
        attemptId: attemptSouth.id,
        studentId: studentSouth.id,
        studentIds: [studentSouth.id]
      },
      recipientUserId: parent.id,
      isRead: true,
      createdById: supervisor.id,
      createdAt: dateTimeDaysAgo(1, 6),
      readAt: dateTimeDaysAgo(1, 5)
    }
  ];

  for (const item of notificationSeeds) {
    const existing = await prisma.notification.findFirst({
      where: {
        organizationId: item.organizationId,
        recipientUserId: item.recipientUserId,
        type: item.type,
        title: item.title
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          organizationId: item.organizationId,
          centerId: item.centerId ?? null,
          circleId: item.circleId ?? null,
          type: item.type,
          title: item.title,
          body: item.body,
          payload: item.payload,
          recipientUserId: item.recipientUserId,
          isRead: item.isRead,
          createdById: item.createdById ?? null,
          createdAt: item.createdAt,
          readAt: item.readAt ?? null
        }
      });
    }
  }

  const northLibraryItem = await prisma.libraryItem.findFirst({
    where: {
      organizationId: organization.id,
      title: "واجب حلقة النور"
    },
    select: {
      id: true,
      centerId: true,
      circleId: true
    }
  });

  const southLibraryItem = await prisma.libraryItem.findFirst({
    where: {
      organizationId: organization.id,
      title: "ورقة مراجعة حلقة الهدى"
    },
    select: {
      id: true,
      centerId: true,
      circleId: true
    }
  });

  const northPayment = await prisma.payment.findFirst({
    where: {
      invoiceId: invoiceNorthCurrent.id
    },
    orderBy: [
      {
        createdAt: "desc"
      }
    ],
    select: {
      id: true,
      amount: true
    }
  });

  const auditSeeds: Array<{
    organizationId: number;
    centerId?: number | null;
    circleId?: number | null;
    actorUserId?: number | null;
    actorRole: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: number;
    summary: string;
    metadata: Prisma.InputJsonValue;
    createdAt: Date;
  }> = [
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      circleId: circleNoor.id,
      actorUserId: superAdmin.id,
      actorRole: Role.SUPER_ADMIN,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.EXAM,
      entityId: examNorth.id,
      summary: "إنشاء اختبار مركز النور",
      metadata: {
        title: examNorth.title,
        type: examNorth.type
      },
      createdAt: dateTimeDaysAgo(3, 9)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      circleId: circleNoor.id,
      actorUserId: superAdmin.id,
      actorRole: Role.SUPER_ADMIN,
      action: AuditAction.PUBLISH,
      entityType: AuditEntityType.EXAM,
      entityId: examNorth.id,
      summary: "نشر اختبار مركز النور",
      metadata: {
        status: examNorth.status
      },
      createdAt: dateTimeDaysAgo(2, 10)
    },
    {
      organizationId: organization.id,
      centerId: centerSouth.id,
      circleId: circleHuda.id,
      actorUserId: supervisor.id,
      actorRole: Role.SUPERVISOR,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.EXAM,
      entityId: examSouth.id,
      summary: "تحديث إعدادات اختبار حلقة الهدى",
      metadata: {
        title: examSouth.title,
        status: examSouth.status
      },
      createdAt: dateTimeDaysAgo(2, 11)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      circleId: circleNoor.id,
      actorUserId: teacherNorth.id,
      actorRole: Role.TEACHER,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attemptNorth.id,
      summary: "إنشاء محاولة اختبار للطالب أحمد",
      metadata: {
        examId: examNorth.id,
        studentId: studentNorth.id
      },
      createdAt: dateTimeDaysAgo(2, 12)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      circleId: circleNoor.id,
      actorUserId: teacherNorth.id,
      actorRole: Role.TEACHER,
      action: AuditAction.SCORE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attemptNorth.id,
      summary: "تقييم محاولة اختبار أحمد",
      metadata: {
        totalScore: 88,
        gradeLabel: "جيد جدا"
      },
      createdAt: dateTimeDaysAgo(2, 13)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      actorUserId: centerAdmin.id,
      actorRole: Role.CENTER_ADMIN,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.INVOICE,
      entityId: invoiceNorthCurrent.id,
      summary: "إصدار فاتورة شهرية للطالب أحمد",
      metadata: {
        studentId: studentNorth.id,
        month: currentMonth,
        year: currentYear
      },
      createdAt: dateTimeDaysAgo(1, 8)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      actorUserId: centerAdmin.id,
      actorRole: Role.CENTER_ADMIN,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.INVOICE,
      entityId: invoiceNorthCurrent.id,
      summary: "تحديث حالة فاتورة الطالب أحمد",
      metadata: {
        status: InvoiceStatus.PARTIAL
      },
      createdAt: dateTimeDaysAgo(1, 9)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      actorUserId: centerAdmin.id,
      actorRole: Role.CENTER_ADMIN,
      action: AuditAction.EXPORT,
      entityType: AuditEntityType.REPORT_EXPORT,
      entityId: attendanceReportFile.id,
      summary: "تصدير تقرير حضور PDF",
      metadata: {
        reportType: ReportType.ATTENDANCE,
        fileId: attendanceReportFile.id
      },
      createdAt: dateTimeDaysAgo(1, 10)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      actorUserId: centerAdmin.id,
      actorRole: Role.CENTER_ADMIN,
      action: AuditAction.DOWNLOAD,
      entityType: AuditEntityType.REPORT_EXPORT,
      entityId: financeReportFile.id,
      summary: "تنزيل تقرير مالي",
      metadata: {
        reportType: ReportType.FINANCE,
        fileId: financeReportFile.id
      },
      createdAt: dateTimeDaysAgo(1, 11)
    },
    {
      organizationId: organization.id,
      actorUserId: superAdmin.id,
      actorRole: Role.SUPER_ADMIN,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.SETTINGS,
      entityId: organization.id,
      summary: "تحديث إعدادات النظام العامة",
      metadata: {
        section: "general"
      },
      createdAt: dateTimeDaysAgo(1, 12)
    },
    {
      organizationId: organization.id,
      centerId: centerNorth.id,
      actorUserId: superAdmin.id,
      actorRole: Role.SUPER_ADMIN,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.USER,
      entityId: centerAdmin.id,
      summary: "إنشاء حساب مدير مركز",
      metadata: {
        role: Role.CENTER_ADMIN
      },
      createdAt: dateTimeDaysAgo(4, 9)
    }
  ];

  if (northPayment) {
    auditSeeds.push({
      organizationId: organization.id,
      centerId: centerNorth.id,
      actorUserId: centerAdmin.id,
      actorRole: Role.CENTER_ADMIN,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.PAYMENT,
      entityId: northPayment.id,
      summary: "تسجيل دفعة على فاتورة أحمد",
      metadata: {
        invoiceId: invoiceNorthCurrent.id,
        amount: Number(northPayment.amount)
      },
      createdAt: dateTimeDaysAgo(1, 9)
    });
  }

  if (northLibraryItem) {
    auditSeeds.push({
      organizationId: organization.id,
      centerId: northLibraryItem.centerId,
      circleId: northLibraryItem.circleId,
      actorUserId: teacherNorth.id,
      actorRole: Role.TEACHER,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.LIBRARY_ITEM,
      entityId: northLibraryItem.id,
      summary: "رفع ملف واجب حلقة النور",
      metadata: {
        circleId: circleNoor.id
      },
      createdAt: dateTimeDaysAgo(2, 14)
    });
  }

  if (southLibraryItem) {
    auditSeeds.push({
      organizationId: organization.id,
      centerId: southLibraryItem.centerId,
      circleId: southLibraryItem.circleId,
      actorUserId: teacherSouth.id,
      actorRole: Role.TEACHER,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.LIBRARY_ITEM,
      entityId: southLibraryItem.id,
      summary: "تحديث ملف مراجعة حلقة الهدى",
      metadata: {
        circleId: circleHuda.id
      },
      createdAt: dateTimeDaysAgo(1, 14)
    });
  }

  for (const item of auditSeeds) {
    const existing = await prisma.auditLog.findFirst({
      where: {
        organizationId: item.organizationId,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        summary: item.summary
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      await prisma.auditLog.create({
        data: {
          organizationId: item.organizationId,
          centerId: item.centerId ?? null,
          circleId: item.circleId ?? null,
          actorUserId: item.actorUserId ?? null,
          actorRole: item.actorRole,
          action: item.action,
          entityType: item.entityType,
          entityId: item.entityId,
          summary: item.summary,
          metadata: item.metadata,
          createdAt: item.createdAt
        }
      });
    }
  }

  console.log("اكتملت بيانات البذرة بنجاح");
  console.log(`كلمة المرور الافتراضية لجميع الحسابات التجريبية: ${DEFAULT_PASSWORD}`);
  console.log("الحسابات التجريبية:");
  console.table([
    { role: "SUPER_ADMIN", email: "superadmin@rafiq.local" },
    { role: "CENTER_ADMIN", email: "center.admin@rafiq.local" },
    { role: "CENTER_ADMIN", email: "center.admin.south@rafiq.local" },
    { role: "SUPERVISOR", email: "supervisor@rafiq.local" },
    { role: "TEACHER", email: "teacher.noor@rafiq.local" },
    { role: "TEACHER", email: "teacher.huda@rafiq.local" },
    { role: "PARENT", email: "parent@rafiq.local" },
    { role: "STUDENT", email: "student.ahmed@rafiq.local" },
    { role: "STUDENT", email: "student.sara@rafiq.local" }
  ]);
}

async function main() {
  // Fix any existing attempts that have totalScore but status still SCHEDULED (seed bug fix)
  const fixedAttempts = await prisma.examAttempt.updateMany({
    where: {
      totalScore: { not: null },
      status: AttemptStatus.SCHEDULED
    },
    data: { status: AttemptStatus.APPROVED }
  });
  if (fixedAttempts.count > 0) {
    console.log(`تم إصلاح ${fixedAttempts.count} محاولة اختبار كان بها درجة ولكن حالتها مجدولة`);
  }

  await cleanup();
  await seed();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

