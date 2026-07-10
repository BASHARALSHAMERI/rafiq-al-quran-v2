import {
  AchievementCategory,
  AttemptStatus,
  CommitteeRole,
  GoldenRecordStatus,
  GoldenRecordType,
  RiwayaType,
  Role
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { encryptToken, decryptToken } from "../../shared/utils/crypto";
import { env } from "../../config/env";

type CertificateKind = "EXAM" | "FULL_QURAN_COMPLETION" | "IJAZAH";

type SignatureSlot = {
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
  verifyUrl: string;
  signatures: [SignatureSlot, SignatureSlot, SignatureSlot];
};

const dateOnly = (value: Date | null | undefined): string | null =>
  value ? value.toISOString().slice(0, 10) : null;

const padded = (value: number): string => String(value).padStart(5, "0");

const examTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    JUZ: "اختبار جزء",
    FULL_QURAN: "اختبار القرآن الكريم كاملًا",
    SURAH_RANGE: "اختبار نطاق سور",
    OTHER: "اختبار"
  };

  return labels[type] ?? "اختبار";
};

const riwayaLabel = (riwaya: RiwayaType | null): string | null => {
  if (!riwaya) {
    return null;
  }

  const labels: Record<RiwayaType, string> = {
    HAFS: "حفص عن عاصم",
    WARSH: "ورش عن نافع"
  };

  return labels[riwaya] ?? riwaya;
};

const scopeIncludes = (values: number[], id: number): boolean => values.includes(id);

const assertAttemptCertificateVisibility = async (
  scope: ScopeContext,
  input: {
    centerId: number;
    circleId: number;
    studentId: number;
    teacherId?: number | null;
    committeeUserIds: number[];
    status: AttemptStatus;
  }
) => {
  if (scope.role === Role.SUPER_ADMIN) {
    return;
  }

  if (scope.role === Role.CENTER_ADMIN && scopeIncludes(scope.centerIds, input.centerId)) {
    return;
  }

  if (
    (scope.role === Role.SUPERVISOR || scope.role === Role.TEACHER) &&
    (input.committeeUserIds.includes(scope.userId) || input.teacherId === scope.userId)
  ) {
    return;
  }

  if (scope.role === Role.STUDENT && input.studentId === scope.userId && input.status === AttemptStatus.PUBLISHED) {
    return;
  }

  if (scope.role === Role.PARENT && input.status === AttemptStatus.PUBLISHED) {
    const link = await prisma.parentStudentLink.findUnique({
      where: {
        parentId_studentId: {
          parentId: scope.userId,
          studentId: input.studentId
        }
      },
      select: { id: true }
    });

    if (link) {
      return;
    }
  }

  throw new AppError("ليس لديك صلاحية طباعة هذه الشهادة", 403);
};

const assertGoldenRecordVisibility = (scope: ScopeContext, centerId: number) => {
  if (scope.role === Role.SUPER_ADMIN) {
    return;
  }

  if (scope.role === Role.CENTER_ADMIN && scopeIncludes(scope.centerIds, centerId)) {
    return;
  }

  throw new AppError("ليس لديك صلاحية طباعة هذه الشهادة", 403);
};

const buildExamRangeLabel = (exam: { type: string; examBranch: string | null; title: string }) => {
  let label = "";

  if (exam.examBranch?.trim()) {
    label = exam.examBranch.trim();
  } else if (exam.type === "FULL_QURAN") {
    return "كامل القرآن الكريم";
  } else {
    label = exam.title;
  }

  // Remove ayah numbers and extra details like (Surah 1 - Surah 100) -> (Surah - Surah)
  return label
    .replace(/[0-9]+/g, "")
    .replace(/\s*-\s*/g, " - ")
    .replace(/[:]/g, "")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s\s+/g, " ")
    .trim();
};

export const certificatesService = {
  async getExamAttemptCertificate(scope: ScopeContext, attemptId: number): Promise<CertificateTemplateData> {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        studentId: true,
        circleId: true,
        examDate: true,
        totalScore: true,
        gradeLabel: true,
        status: true,
        approvedBy: {
          select: {
            fullName: true
          }
        },
        publishedBy: {
          select: {
            fullName: true
          }
        },
        student: {
          select: {
            fullName: true
          }
        },
        committeeMembers: {
          orderBy: [{ committeeRole: "asc" }, { id: "asc" }],
          select: {
            userId: true,
            committeeRole: true,
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        circle: {
          select: {
            id: true,
            name: true,
            teacherId: true,
            center: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                organizationId: true,
                centerAdmin: {
                  select: {
                    fullName: true
                  }
                },
                organization: {
                  select: {
                    id: true,
                    name: true,
                    logoUrl: true
                  }
                }
              }
            }
          }
        },
        exam: {
          select: {
            title: true,
            type: true,
            examBranch: true,
            maxScore: true,
            passScore: true,
            status: true
          }
        }
      }
    });

    if (!attempt) {
      throw new AppError(`محاولة الاختبار بالرقم ${attemptId} غير موجودة أو لا يمكن الوصول إليها`, 404);
    }

    // Security check: ensure user belongs to the same organization as the attempt
    if (!scope.allAccess && attempt.circle.center.organizationId !== scope.organizationId) {
      throw new AppError("ليس لديك صلاحية الوصول لهذه الشهادة (تعارض في المنظمة)", 403);
    }

    await assertAttemptCertificateVisibility(scope, {
      centerId: attempt.circle.center.id,
      circleId: attempt.circleId,
      studentId: attempt.studentId,
      teacherId: attempt.circle.teacherId,
      committeeUserIds: attempt.committeeMembers.map((member) => member.userId),
      status: attempt.status
    });

    if (attempt.status !== AttemptStatus.APPROVED && attempt.status !== AttemptStatus.PUBLISHED) {
      throw new AppError("الشهادة متاحة فقط للمحاولات المعتمدة أو المنشورة", 409);
    }

    if (attempt.totalScore === null || attempt.totalScore < attempt.exam.passScore) {
      throw new AppError("الشهادة متاحة فقط لمحاولات الاختبار الناجحة", 409);
    }

    const associationName = attempt.circle.center.organization.name;
    const centerName = attempt.circle.center.name;
    const chair = attempt.committeeMembers.find((member) => member.committeeRole === CommitteeRole.CHAIR);
    const examDate = dateOnly(attempt.examDate);
    const year = examDate?.slice(0, 4) ?? new Date().getFullYear();
    const rangeLabel = buildExamRangeLabel(attempt.exam);
    const examCategory = examTypeLabel(attempt.exam.type);

    const examTitle = attempt.exam.title;
    let finalRangeLabel = rangeLabel;
    if (examTitle && finalRangeLabel.startsWith(examTitle)) {
      finalRangeLabel = finalRangeLabel.replace(examTitle, "").trim();
      // Remove leading dash or parenthesis if left over
      finalRangeLabel = finalRangeLabel.replace(/^[(\s-]+/, "").replace(/[)\s-]+$/, "").trim();
    }

    const token = encryptToken(`EXAM:${attempt.id}`);
    const frontendBase = env.FRONTEND_BASE_URL || env.CORS_ORIGIN || "http://localhost:5173";
    const verifyUrl = `${frontendBase}/verify/certificate/${token}`;

    return {
      kind: "EXAM",
      associationName,
      associationLogoUrl: attempt.circle.center.organization.logoUrl,
      centerName,
      centerLogoUrl: attempt.circle.center.logoUrl,
      certificateTitle: "شهادة شكر وتقدير",
      certificateSubtitle: "لوثائق الإنجاز والثبات والحفظ القرآني",
      studentName: attempt.student.fullName,
      circleName: attempt.circle.name,
      examTitle,
      examCategory,
      rangeLabel: finalRangeLabel || rangeLabel,
      gradeLabel: attempt.gradeLabel ?? "ناجح",
      examDate,
      completionDate: null,
      riwaya: null,
      certificateSerial: `EX-${year}-${padded(attempt.id)}`,
      detailLine: `تاريخ الاختبار: ${examDate ?? "-"} | الحلقة: ${attempt.circle.name} | ${examCategory}`,
      verifyUrl,
      signatures: [
        {
          role: "رئيس لجنة الاختبار",
          name: chair?.user.fullName ?? "الاسم والتوقيع"
        },
        {
          role: "مدير المركز",
          name: attempt.circle.center.centerAdmin?.fullName ?? "الاسم والتوقيع"
        },
        {
          role: "اعتماد الجمعية",
          name: attempt.publishedBy?.fullName ?? attempt.approvedBy?.fullName ?? "الختم / التوقيع"
        }
      ]
    };
  },

  async getGoldenRecordCertificate(scope: ScopeContext, recordId: number): Promise<CertificateTemplateData> {
    const record = await prisma.goldenRecord.findFirst({
      where: {
        id: recordId,
        organizationId: scope.organizationId
      },
      select: {
        id: true,
        year: true,
        type: true,
        status: true,
        registrySerial: true,
        studentNameSnapshot: true,
        centerNameSnapshot: true,
        circleNameSnapshot: true,
        grade: true,
        appreciation: true,
        examDate: true,
        riwaya: true,
        centerId: true,
        studentId: true,
        approvedBy: {
          select: {
            fullName: true
          }
        },
        examAttempt: {
          select: {
            committeeMembers: {
              orderBy: [{ committeeRole: "asc" }, { id: "asc" }],
              select: {
                committeeRole: true,
                user: {
                  select: {
                    fullName: true
                  }
                }
              }
            }
          }
        },
        center: {
          select: {
            name: true,
            logoUrl: true,
            centerAdmin: {
              select: {
                fullName: true
              }
            },
            organization: {
              select: {
                id: true,
                name: true,
                logoUrl: true
              }
            }
          }
        },
        achievementSnapshot: {
          select: {
            id: true
          }
        }
      }
    });

    if (!record) {
      throw new AppError("السجل الذهبي النهائي غير موجود", 404);
    }

    assertGoldenRecordVisibility(scope, record.centerId);

    if (record.status !== GoldenRecordStatus.APPROVED) {
      throw new AppError("شهادة الإتمام متاحة فقط للسجلات الذهبية النهائية المعتمدة", 409);
    }

    if (record.type !== GoldenRecordType.KHATEM && record.type !== GoldenRecordType.IJAZAH) {
      throw new AppError("شهادة الإتمام متاحة لسجلات إتمام القرآن كاملاً أو الإجازة فقط", 409);
    }

    const riwaya = riwayaLabel(record.riwaya);
    const completionDate = dateOnly(record.examDate);

    if (!riwaya || !record.grade?.trim() || !record.appreciation?.trim() || !completionDate) {
      throw new AppError("شهادة الإتمام تتطلب الرواية والدرجة والتقدير وتاريخ الاعتماد", 422);
    }

    if (!record.achievementSnapshot) {
      try {
        await prisma.studentYearlyAchievementSnapshot.upsert({
          where: {
            organizationId_studentId_year: {
              organizationId: record.center.organization.id,
              studentId: record.studentId,
              year: record.year
            }
          },
          update: {
            goldenRecordId: record.id,
            achievementCategory: AchievementCategory.JUZ_30,
            juzCount: 30,
            snapshotSource: "GOLDEN_CERTIFICATE",
            capturedAt: new Date()
          },
          create: {
            organizationId: record.center.organization.id,
            year: record.year,
            studentId: record.studentId,
            centerId: record.centerId,
            achievementCategory: AchievementCategory.JUZ_30,
            juzCount: 30,
            goldenRecordId: record.id,
            snapshotSource: "GOLDEN_CERTIFICATE",
            capturedById: scope.userId
          }
        });
      } catch {
        throw new AppError(
          "لا يمكن طباعة الشهادة لأن بيانات الإنجاز النهائية غير مكتملة.",
          409
        );
      }
    }

    const chair = record.examAttempt?.committeeMembers.find(
      (member) => member.committeeRole === CommitteeRole.CHAIR
    );

    const token = encryptToken(`GOLDEN:${record.id}`);
    const frontendBase = env.FRONTEND_BASE_URL || env.CORS_ORIGIN || "http://localhost:5173";
    const verifyUrl = `${frontendBase}/verify/certificate/${token}`;

    const isIjazah = record.type === GoldenRecordType.IJAZAH;

    return {
      kind: isIjazah ? "IJAZAH" : "FULL_QURAN_COMPLETION",
      associationName: record.center.organization.name,
      associationLogoUrl: record.center.organization.logoUrl,
      centerName: record.centerNameSnapshot || record.center.name,
      centerLogoUrl: record.center.logoUrl,
      certificateTitle: isIjazah ? "شهادة إجازة قرآنية" : "شهادة إتمام حفظ القرآن الكريم",
      certificateSubtitle: isIjazah ? "وثيقة إجازة وتثبيت بالسند المتصل" : "لوثائق الختم والإتقان والحفظ المبارك",
      studentName: record.studentNameSnapshot,
      circleName: record.circleNameSnapshot,
      examTitle: isIjazah ? "الإجازة بالسند المتصل" : "ختم القرآن الكريم كاملًا",
      examCategory: isIjazah ? "إجازة قرآنية" : "إتمام حفظ القرآن الكريم",
      rangeLabel: isIjazah ? `رواية ${riwaya}` : "كامل القرآن الكريم",
      gradeLabel: record.appreciation || record.grade,
      examDate: null,
      completionDate,
      riwaya,
      certificateSerial:
        record.registrySerial ?? `GR-${record.year}-${record.center.organization.id}-${padded(record.id)}`,
      detailLine: isIjazah
        ? `تاريخ الإجازة/الاعتماد: ${completionDate} | الحلقة: ${record.circleNameSnapshot ?? "-"} | الرواية: ${riwaya}`
        : `تاريخ الختم/الاعتماد: ${completionDate} | الحلقة: ${record.circleNameSnapshot ?? "-"} | الرواية: ${riwaya}`,
      verifyUrl,
      signatures: [
        {
          role: "رئيس لجنة الاعتماد",
          name: chair?.user.fullName ?? "الاسم والتوقيع"
        },
        {
          role: "مدير المركز",
          name: record.center.centerAdmin?.fullName ?? "الاسم والتوقيع"
        },
        {
          role: "اعتماد الجمعية",
          name: record.approvedBy?.fullName ?? "الختم / التوقيع"
        }
      ]
    };
  },

  async verifyCertificate(token: string) {
    const decrypted = decryptToken(token);
    if (!decrypted) {
      throw new AppError("رمز تحقق غير صالح أو تالف", 400);
    }

    const [type, idStr] = decrypted.split(":");
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      throw new AppError("رمز تحقق غير صالح أو تالف", 400);
    }

    if (type === "EXAM") {
      const attempt = await prisma.examAttempt.findUnique({
        where: { id },
        select: {
          id: true,
          examDate: true,
          totalScore: true,
          gradeLabel: true,
          status: true,
          student: {
            select: {
              fullName: true
            }
          },
          circle: {
            select: {
              name: true,
              center: {
                select: {
                  name: true,
                  organization: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          exam: {
            select: {
              title: true,
              type: true,
              maxScore: true,
              passScore: true
            }
          }
        }
      });

      if (!attempt) {
        throw new AppError("الشهادة المطلوبة غير موجودة", 404);
      }

      const isValid = attempt.status === AttemptStatus.APPROVED || attempt.status === AttemptStatus.PUBLISHED;
      const examDate = dateOnly(attempt.examDate);
      const year = examDate?.slice(0, 4) ?? new Date().getFullYear();

      return {
        isValid,
        kind: "EXAM",
        studentName: attempt.student.fullName,
        certificateTitle: "شهادة شكر وتقدير",
        examTitle: attempt.exam.title,
        examCategory: examTypeLabel(attempt.exam.type),
        gradeLabel: attempt.gradeLabel ?? "ناجح",
        examDate,
        associationName: attempt.circle.center.organization.name,
        centerName: attempt.circle.center.name,
        certificateSerial: `EX-${year}-${padded(attempt.id)}`
      };
    } else if (type === "GOLDEN") {
      const record = await prisma.goldenRecord.findUnique({
        where: { id },
        select: {
          id: true,
          year: true,
          type: true,
          status: true,
          registrySerial: true,
          studentNameSnapshot: true,
          centerNameSnapshot: true,
          grade: true,
          appreciation: true,
          examDate: true,
          riwaya: true,
          center: {
            select: {
              name: true,
              organization: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!record) {
        throw new AppError("الشهادة المطلوبة غير موجودة", 404);
      }

      const isValid = record.status === GoldenRecordStatus.APPROVED;
      const completionDate = dateOnly(record.examDate);
      const riwaya = riwayaLabel(record.riwaya);

      return {
        isValid,
        kind: record.type, // "KHATEM" or "IJAZAH"
        studentName: record.studentNameSnapshot,
        certificateTitle: record.type === GoldenRecordType.KHATEM ? "شهادة إتمام حفظ القرآن الكريم" : "شهادة إجازة قرآنية",
        examTitle: record.type === GoldenRecordType.KHATEM ? "ختم القرآن الكريم كاملًا" : "الإجازة بالسند المتصل",
        gradeLabel: record.appreciation || record.grade,
        examDate: completionDate,
        associationName: record.center.organization.name,
        centerName: record.centerNameSnapshot || record.center.name,
        riwaya,
        certificateSerial: record.registrySerial ?? `GR-${record.year}-${record.center.organization.id}-${padded(record.id)}`
      };
    }

    throw new AppError("نوع رمز تحقق غير معروف", 400);
  }
};