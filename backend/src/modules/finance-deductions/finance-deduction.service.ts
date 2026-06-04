import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { ScopeContext } from "../../shared/types/auth.types";
import {
  AttendanceStatus,
  DeductionCalcType,
  DeductionEventStatus,
  DeductionTriggerType,
  LeaveRequestStatus,
  LeaveType,
  Role,
  VisitPlanItemStatus
} from "@prisma/client";

const mapDeductionTypeToDb = (value: string | DeductionCalcType): DeductionCalcType => {
  const normalized = String(value).toUpperCase();
  if (normalized === "PER_OCCURRENCE" || normalized === "PER_HOUR") {
    return DeductionCalcType.PER_OCCURRENCE;
  }
  if (normalized === "PER_DAY") {
    return DeductionCalcType.PER_DAY;
  }
  return DeductionCalcType.FIXED;
};

const mapDeductionTypeToApi = (
  value: DeductionCalcType
): "FIXED" | "PER_DAY" | "PER_OCCURRENCE" => {
  if (value === DeductionCalcType.PER_OCCURRENCE) return "PER_OCCURRENCE";
  if (value === DeductionCalcType.PER_DAY) return "PER_DAY";
  return "FIXED";
};

const mapDeductionStatusToDb = (
  value?: string | DeductionEventStatus
): DeductionEventStatus | undefined => {
  if (!value) return undefined;
  const normalized = String(value).toUpperCase();
  switch (normalized) {
    case "PENDING":
    case "DEDUCTION_PENDING":
      return DeductionEventStatus.DEDUCTION_PENDING;
    case "APPROVED":
    case "DEDUCTION_APPROVED":
      return DeductionEventStatus.DEDUCTION_APPROVED;
    case "REJECTED":
    case "DEDUCTION_REJECTED":
      return DeductionEventStatus.DEDUCTION_REJECTED;
    case "WAIVED":
    case "DEDUCTION_WAIVED":
      return DeductionEventStatus.DEDUCTION_WAIVED;
    case "INCLUDED_IN_PAYROLL":
    case "DEDUCTION_INCLUDED_IN_PAYROLL":
      return DeductionEventStatus.DEDUCTION_INCLUDED_IN_PAYROLL;
    default:
      return undefined;
  }
};

const toRuleResponse = (rule: {
  deductionAmountSAR: { toString(): string } | number;
  deductionType: DeductionCalcType;
  [key: string]: unknown;
}) => {
  const deductionType = mapDeductionTypeToApi(rule.deductionType);
  const deductionAmountSAR = Number(rule.deductionAmountSAR);

  return {
    ...rule,
    deductionAmountSAR,
    amount: deductionAmountSAR,
    deductionType,
    calcType: deductionType
  };
};

const toEventResponse = (event: {
  calculatedAmountSAR: { toString(): string } | number;
  occurrenceCount: number;
  status: DeductionEventStatus;
  [key: string]: unknown;
}) => ({
  ...event,
  status: mapDeductionStatusToApi(event.status),
  amount: Number(event.calculatedAmountSAR),
  occurrences: event.occurrenceCount,
  calculatedAmountSAR: Number(event.calculatedAmountSAR)
});

const getMonthRange = (month: number, year: number) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));
  return { startDate, endDate };
};

const overlapDaysInRange = (
  startA: Date,
  endA: Date,
  startB: Date,
  endBExclusive: Date
) => {
  const overlapStart = Math.max(startA.getTime(), startB.getTime());
  const overlapEnd = Math.min(endA.getTime(), endBExclusive.getTime() - 1);

  if (overlapStart > overlapEnd) {
    return 0;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((overlapEnd - overlapStart) / dayMs) + 1;
};

const mapDeductionStatusToApi = (
  value: DeductionEventStatus
): "PENDING" | "APPROVED" | "REJECTED" | "WAIVED" | "INCLUDED_IN_PAYROLL" => {
  switch (value) {
    case DeductionEventStatus.DEDUCTION_APPROVED:
      return "APPROVED";
    case DeductionEventStatus.DEDUCTION_REJECTED:
      return "REJECTED";
    case DeductionEventStatus.DEDUCTION_WAIVED:
      return "WAIVED";
    case DeductionEventStatus.DEDUCTION_INCLUDED_IN_PAYROLL:
      return "INCLUDED_IN_PAYROLL";
    default:
      return "PENDING";
  }
};

export const financeDeductionService = {
  // ==========================================
  // Rules
  // ==========================================
  async listRules(scope: ScopeContext) {
    if (
      scope.role !== Role.SUPER_ADMIN &&
      scope.role !== Role.ACCOUNTANT &&
      scope.role !== Role.FINANCE_MANAGER &&
      scope.role !== Role.AUDITOR
    ) {
      throw new AppError("ليس لديك صلاحية", 403);
    }
    const rules = await prisma.financeDeductionRule.findMany({
      where: { organizationId: scope.organizationId }
    });
    return rules.map((rule) => toRuleResponse(rule));
  },

  async upsertRule(
    scope: ScopeContext,
    input: {
      triggerType: DeductionTriggerType;
      thresholdCount?: number | null;
      deductionAmountSAR: number;
      deductionType: DeductionCalcType | "PER_HOUR" | "PER_OCCURRENCE";
      isActive: boolean;
      description?: string | null;
    }
  ) {
    if (scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("فقط مدير النظام يمكنه إدارة قواعد الخصم", 403);
    }

    const deductionType = mapDeductionTypeToDb(input.deductionType);

    const rule = await prisma.financeDeductionRule.upsert({
      where: {
        organizationId_triggerType: {
          organizationId: scope.organizationId,
          triggerType: input.triggerType
        }
      },
      update: {
        thresholdCount: input.thresholdCount,
        deductionAmountSAR: input.deductionAmountSAR,
        deductionType,
        isActive: input.isActive,
        description: input.description
      },
      create: {
        organizationId: scope.organizationId,
        triggerType: input.triggerType,
        thresholdCount: input.thresholdCount,
        deductionAmountSAR: input.deductionAmountSAR,
        deductionType,
        isActive: input.isActive,
        description: input.description
      }
    });

    return toRuleResponse(rule);
  },

  // ==========================================
  // Event Generation
  // ==========================================
  async generateMonthlyDeductions(scope: ScopeContext, month: number, year: number) {
    if (scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("فقط مدير النظام يمكنه توليد الاستقطاعات", 403);
    }

    const orgId = scope.organizationId;
    const rules = await prisma.financeDeductionRule.findMany({
      where: { organizationId: orgId, isActive: true }
    });

    if (rules.length === 0) return { generatedCount: 0, message: "No active deduction rules found" };

    // Get all users in org
    const staff = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, role: true }
    });

    const { startDate, endDate } = getMonthRange(month, year);

    let generatedCount = 0;

    for (const user of staff) {
      const [attendance, unpaidLeaves, targetCenterId] = await Promise.all([
        prisma.staffAttendanceRecord.findMany({
          where: { userId: user.id, organizationId: orgId, attendanceDate: { gte: startDate, lt: endDate } }
        }),
        prisma.staffLeaveRequest.findMany({
          where: {
            userId: user.id,
            organizationId: orgId,
            leaveType: LeaveType.UNPAID,
            status: LeaveRequestStatus.LEAVE_APPROVED,
            startDate: { lt: endDate },
            endDate: { gte: startDate }
          },
          select: {
            centerId: true,
            startDate: true,
            endDate: true,
            totalDays: true
          }
        }),
        this.resolveTargetCenterId(orgId, user.id, startDate, endDate)
      ]);

      if (!targetCenterId) continue;

      // 1. Unexcused Absences
      const unexcusedAbsences = attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
      if (unexcusedAbsences > 0) {
        generatedCount += await this._evaluateRule(rules, DeductionTriggerType.UNEXCUSED_ABSENCE, unexcusedAbsences, orgId, user.id, targetCenterId, month, year);
      }

      // 2. Lates
      const lates = attendance.filter(a => a.status === AttendanceStatus.LATE || (a.lateMinutes && a.lateMinutes > 0)).length;
      if (lates > 0) {
        generatedCount += await this._evaluateRule(rules, DeductionTriggerType.LATE_THRESHOLD, lates, orgId, user.id, targetCenterId, month, year);
      }

      // 3. Early Departures
      const earlyDepartures = attendance.filter(a => a.earlyDepartureMinutes && a.earlyDepartureMinutes > 0).length;
      if (earlyDepartures > 0) {
        generatedCount += await this._evaluateRule(rules, DeductionTriggerType.EARLY_DEPARTURE, earlyDepartures, orgId, user.id, targetCenterId, month, year);
      }

      // 4. Unpaid Leave
      const unpaidLeaveDays = unpaidLeaves.reduce((sum, leave) => {
        const fallbackEnd = new Date(leave.startDate.getTime() + (Math.max(leave.totalDays, 1) - 1) * 24 * 60 * 60 * 1000);
        const resolvedEnd = leave.endDate ?? fallbackEnd;
        return sum + overlapDaysInRange(leave.startDate, resolvedEnd, startDate, endDate);
      }, 0);
      if (unpaidLeaveDays > 0) {
        generatedCount += await this._evaluateRule(rules, DeductionTriggerType.UNPAID_LEAVE, unpaidLeaveDays, orgId, user.id, targetCenterId, month, year);
      }

      // 5. Missed Visits (Supervisors only)
      if (user.role === Role.SUPERVISOR) {
        const missedVisits = await prisma.supervisorVisitPlanItem.count({
          where: {
            plan: { supervisorId: user.id, organizationId: orgId },
            plannedDate: { gte: startDate, lt: endDate },
            status: VisitPlanItemStatus.VISIT_ITEM_MISSED
          }
        });
        if (missedVisits > 0) {
          generatedCount += await this._evaluateRule(rules, DeductionTriggerType.MISSED_VISIT, missedVisits, orgId, user.id, targetCenterId, month, year);
        }
      }
    }

    return { generatedCount, message: `Successfully generated/updated ${generatedCount} deduction events.` };
  },

  async resolveTargetCenterId(orgId: number, userId: number, startDate: Date, endDate: Date) {
    const sampleAttendance = await prisma.staffAttendanceRecord.findFirst({
      where: { userId, organizationId: orgId, attendanceDate: { gte: startDate, lt: endDate } },
      orderBy: { attendanceDate: "desc" },
      select: { centerId: true }
    });

    if (sampleAttendance?.centerId) {
      return sampleAttendance.centerId;
    }

    const approvedLeave = await prisma.staffLeaveRequest.findFirst({
      where: {
        userId,
        organizationId: orgId,
        status: LeaveRequestStatus.LEAVE_APPROVED,
        startDate: { lt: endDate },
        endDate: { gte: startDate }
      },
      orderBy: { createdAt: "desc" },
      select: { centerId: true }
    });

    if (approvedLeave?.centerId) {
      return approvedLeave.centerId;
    }

    const activeSchedule = await prisma.staffScheduleAssignment.findFirst({
      where: {
        userId,
        organizationId: orgId,
        isActive: true,
        effectiveFrom: { lte: endDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }]
      },
      orderBy: { updatedAt: "desc" },
      select: { centerId: true }
    });

    return activeSchedule?.centerId ?? null;
  },

  async _evaluateRule(rules: any[], type: DeductionTriggerType, rawCount: number, orgId: number, userId: number, centerId: number, month: number, year: number): Promise<number> {
    const rule = rules.find(r => r.triggerType === type);
    if (!rule) return 0;

    const threshold = rule.thresholdCount || 0;
    const applicableCount = Math.max(0, rawCount - threshold);

    if (applicableCount <= 0) return 0;

    const amount = rule.deductionType === DeductionCalcType.FIXED ? Number(rule.deductionAmountSAR) : Number(rule.deductionAmountSAR) * applicableCount;

    // Check existing — skip if already locked in payroll
    const existing = await prisma.financeDeductionEvent.findFirst({
      where: { organizationId: orgId, userId, triggerType: type, month, year }
    });

    if (existing) {
      // Never modify a deduction that is already included in payroll
      if (existing.status === DeductionEventStatus.DEDUCTION_INCLUDED_IN_PAYROLL) {
        return 0;
      }
      if (existing.status === DeductionEventStatus.DEDUCTION_PENDING && (existing.occurrenceCount !== rawCount || Number(existing.calculatedAmountSAR) !== amount)) {
        await prisma.financeDeductionEvent.update({
          where: { id: existing.id },
          data: { occurrenceCount: rawCount, calculatedAmountSAR: amount }
        });
        return 1;
      }
      return 0;
    }

    await prisma.financeDeductionEvent.create({
      data: {
        organizationId: orgId,
        userId,
        centerId,
        ruleId: rule.id,
        month,
        year,
        triggerType: type,
        occurrenceCount: rawCount,
        calculatedAmountSAR: amount,
        status: DeductionEventStatus.DEDUCTION_PENDING
      }
    });
    return 1;
  },

  // ==========================================
  // Review Workspace
  // ==========================================
  async listEvents(
    scope: ScopeContext,
    query: { centerId?: number; userId?: number; month?: number; year?: number; status?: DeductionEventStatus | string; triggerType?: DeductionTriggerType; page: number; limit: number }
  ) {
    const skip = (query.page - 1) * query.limit;

    const whereClause: any = {
      organizationId: scope.organizationId
    };

    if (scope.role !== Role.SUPER_ADMIN) {
      if (scope.allAccess) {
        // center admin with all access is fine
      } else if (scope.centerIds.length > 0) {
        whereClause.centerId = { in: scope.centerIds };
      } else {
        throw new AppError("ليس لديك صلاحية", 403);
      }
    }

    if (query.centerId) whereClause.centerId = query.centerId;
    if (query.userId) whereClause.userId = query.userId;
    if (query.month) whereClause.month = query.month;
    if (query.year) whereClause.year = query.year;
    const mappedStatus = mapDeductionStatusToDb(query.status);
    if (query.status && !mappedStatus) {
      throw new AppError("فلتر حالة الخصم غير صالح", 400, undefined, "VALIDATION_FAILED");
    }
    if (mappedStatus) whereClause.status = mappedStatus;
    if (query.triggerType) whereClause.triggerType = query.triggerType;

    const [records, total] = await prisma.$transaction([
      prisma.financeDeductionEvent.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
          center: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, fullName: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit
      }),
      prisma.financeDeductionEvent.count({ where: whereClause })
    ]);

    const mappedRecords = records.map((event) => toEventResponse(event));

    return { records: mappedRecords, total, page: query.page, limit: query.limit };
  },

  async reviewEvent(scope: ScopeContext, eventId: number, action: DeductionEventStatus | string, reviewNote?: string) {
    if (scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("فقط مدير النظام يمكنه مراجعة واعتماد أحداث الخصم", 403);
    }

    const mappedAction = mapDeductionStatusToDb(action);
    if (
      !mappedAction ||
      mappedAction === DeductionEventStatus.DEDUCTION_PENDING ||
      mappedAction === DeductionEventStatus.DEDUCTION_INCLUDED_IN_PAYROLL
    ) {
      throw new AppError("إجراء المراجعة غير صالح", 400, undefined, "VALIDATION_FAILED");
    }

    const event = await prisma.financeDeductionEvent.findFirst({
      where: { id: eventId, organizationId: scope.organizationId }
    });

    if (!event) throw new AppError("حدث الخصم غير موجود", 404);

    // B7: Block modification of deductions already included in a payroll batch
    if (event.status === DeductionEventStatus.DEDUCTION_INCLUDED_IN_PAYROLL) {
      throw new AppError(
        "لا يمكن تعديل خصم تم إدراجه في مسير رواتب. استخدم تسوية لاحقة إذا لزم الأمر.",
        409,
        undefined,
        "DEDUCTION_LOCKED_IN_PAYROLL"
      );
    }

    const updated = await prisma.financeDeductionEvent.update({
      where: { id: eventId },
      data: {
        status: mappedAction,
        reviewedById: scope.userId,
        reviewedAt: new Date(),
        reviewNote
      }
    });

    return toEventResponse(updated);
  }
};
