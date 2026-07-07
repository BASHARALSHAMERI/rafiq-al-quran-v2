import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { ScopeContext } from "../../shared/types/auth.types";
import { AttendanceSource, AttendanceStatus, DeductionTriggerType, LeaveRequestStatus, LeaveType, Role, DeductionEventStatus } from "@prisma/client";
import { attendancePolicyService } from "./attendance-policy.service";

const toStartOfDay = (dateString: string | Date) => {
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const staffLeaveService = {
  async submitLeaveRequest(
    scope: ScopeContext,
    input: { centerId?: number | null; leaveType: LeaveType; startDate: string; endDate: string; reason: string; attachmentUrl?: string | null }
  ) {
    const isHQ = !input.centerId;

    // Scope check: HQ employees must be SUPER_ADMIN or have allAccess
    if (isHQ) {
      if (!scope.allAccess) {
        throw new AppError("فقط مدير النظام يمكنه تقديم إجازة لموظف مقر الجمعية", 403);
      }
    } else if (!scope.allAccess && !scope.centerIds.includes(input.centerId!) && scope.role !== Role.TEACHER) {
      throw new AppError("ليس لديك صلاحية الوصول لهذا المركز", 403);
    }

    const start = toStartOfDay(input.startDate);
    const end = toStartOfDay(input.endDate);

    if (start > end) {
      throw new AppError("تاريخ بداية الإجازة يجب أن يكون قبل أو يساوي تاريخ النهاية", 400);
    }

    // Compute total workdays
    let totalDays = 0;
    const current = new Date(start);
    while (current <= end) {
      const isWorkday = await attendancePolicyService.isWorkday(scope.organizationId, current);
      if (isWorkday) {
        totalDays++;
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (totalDays === 0) {
      throw new AppError("النطاق المحدد لا يحتوي على أيام عمل بناءً على سياسة الحضور", 400);
    }

    return prisma.staffLeaveRequest.create({
      data: {
        organizationId: scope.organizationId,
        userId: scope.userId,
        centerId: isHQ ? null : (input.centerId ?? undefined),
        isHeadquarters: isHQ,
        leaveType: input.leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason: input.reason,
        attachmentUrl: input.attachmentUrl,
        status: LeaveRequestStatus.LEAVE_PENDING
      }
    });
  },

  async listLeaveRequests(
    scope: ScopeContext,
    query: { centerId?: number; userId?: number; status?: LeaveRequestStatus; startDate?: string; endDate?: string; page: number; limit: number }
  ) {
    const skip = (query.page - 1) * query.limit;

    const whereClause: any = {
      organizationId: scope.organizationId
    };

    if (scope.role === Role.TEACHER) {
      whereClause.userId = scope.userId;
    } else if (!scope.allAccess && scope.centerIds.length > 0) {
      whereClause.centerId = { in: scope.centerIds };
    }

    if (query.centerId) whereClause.centerId = query.centerId;
    if (query.userId) whereClause.userId = query.userId;
    if (query.status) whereClause.status = query.status;
    if (query.startDate || query.endDate) {
      whereClause.startDate = {
        ...(query.endDate ? { lte: toStartOfDay(query.endDate) } : {})
      };
      whereClause.endDate = {
        ...(query.startDate ? { gte: toStartOfDay(query.startDate) } : {})
      };
    }

    const [records, total] = await prisma.$transaction([
      prisma.staffLeaveRequest.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
          handledBy: { select: { id: true, fullName: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit
      }),
      prisma.staffLeaveRequest.count({ where: whereClause })
    ]);

    return { records, total, page: query.page, limit: query.limit };
  },

  async approveLeave(scope: ScopeContext, leaveId: number, responseNote?: string) {
    if (scope.role !== Role.CENTER_ADMIN && scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("فقط المدراء يمكنهم تحديث حالة الإجازة", 403);
    }

    const leave = await prisma.staffLeaveRequest.findUnique({
      where: { id: leaveId, organizationId: scope.organizationId },
      include: { user: { select: { role: true } } }
    });

    if (!leave) throw new AppError("طلب الإجازة غير موجود", 404);
    if (leave.status !== LeaveRequestStatus.LEAVE_PENDING) {
      throw new AppError("لا يمكن الموافقة إلا على الطلبات المعلقة", 400);
    }

    if (leave.leaveType === LeaveType.UNPAID && scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("إجازات الخصم (UNPAID) تتطلب موافقة مدير النظام", 403);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.staffLeaveRequest.update({
        where: { id: leaveId },
        data: {
          status: LeaveRequestStatus.LEAVE_APPROVED,
          handledById: scope.userId,
          handledAt: new Date(),
          responseNote
        }
      });

      // Insert ON_LEAVE records
      const current = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      let appliedDaysCount = 0;

      while (current <= end) {
        const isWorkday = await attendancePolicyService.isWorkday(scope.organizationId, current);
        if (isWorkday) {
          appliedDaysCount++;
          await tx.staffAttendanceRecord.upsert({
            where: {
              userId_attendanceDate: {
                userId: leave.userId,
                attendanceDate: current
              }
            },
            update: {
              status: AttendanceStatus.ON_LEAVE,
              source: AttendanceSource.SYSTEM,
              note: `إجازة ${leave.leaveType === "MEDICAL" ? "مرضية" : leave.leaveType === "PERSONAL" ? "شخصية" : leave.leaveType === "UNPAID" ? "بدون راتب" : "رسمية"} #${leave.id}`
            },
            create: {
              organizationId: scope.organizationId,
              centerId: leave.centerId ?? null,
              isHeadquarters: leave.isHeadquarters,
              userId: leave.userId,
              attendanceDate: current,
              status: AttendanceStatus.ON_LEAVE,
              source: AttendanceSource.SYSTEM,
              markedById: scope.userId,
              staffRole: leave.user.role as any,
              note: `إجازة ${leave.leaveType === "MEDICAL" ? "مرضية" : leave.leaveType === "PERSONAL" ? "شخصية" : leave.leaveType === "UNPAID" ? "بدون راتب" : "رسمية"} #${leave.id}`
            }
          });
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }

      // If UNPAID, generate FinanceDeductionEvent
      if (leave.leaveType === LeaveType.UNPAID) {
        const rule = await tx.financeDeductionRule.findUnique({
          where: { organizationId_triggerType: { organizationId: scope.organizationId, triggerType: DeductionTriggerType.UNPAID_LEAVE } }
        });

        if (!rule) {
          throw new AppError("لا يوجد قاعدة خصم مالي معرفة للإجازات بدون راتب", 400);
        }

        const amount = Number(rule.amount) * appliedDaysCount;

        await tx.financeDeductionEvent.create({
          data: {
            organizationId: scope.organizationId,
            userId: leave.userId,
            centerId: leave.centerId ?? null,
            isHeadquarters: leave.isHeadquarters,
            ruleId: rule.id,
            month: leave.startDate.getUTCMonth() + 1,
            year: leave.startDate.getUTCFullYear(),
            triggerType: DeductionTriggerType.UNPAID_LEAVE,
            occurrenceCount: appliedDaysCount,
            calculatedAmount: amount,
            status: DeductionEventStatus.DEDUCTION_PENDING,
            details: { leaveId: leave.id }
          }
        });
      }

      return updated;
    });
  },

  async rejectLeave(scope: ScopeContext, leaveId: number, responseNote?: string) {
    if (scope.role !== Role.CENTER_ADMIN && scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("فقط المدراء يمكنهم تحديث حالة الإجازة", 403);
    }

    const leave = await prisma.staffLeaveRequest.findUnique({ where: { id: leaveId, organizationId: scope.organizationId } });
    if (!leave) throw new AppError("طلب الإجازة غير موجود", 404);
    if (leave.status !== LeaveRequestStatus.LEAVE_PENDING) {
      throw new AppError("لا يمكن رفض إلا الطلبات المعلقة", 400);
    }

    return prisma.staffLeaveRequest.update({
      where: { id: leaveId },
      data: {
        status: LeaveRequestStatus.LEAVE_REJECTED,
        handledById: scope.userId,
        handledAt: new Date(),
        responseNote
      }
    });
  },

  async cancelLeave(scope: ScopeContext, leaveId: number) {
    const leave = await prisma.staffLeaveRequest.findUnique({ where: { id: leaveId, organizationId: scope.organizationId } });
    if (!leave) throw new AppError("طلب الإجازة غير موجود", 404);
    if (leave.userId !== scope.userId) throw new AppError("لا يمكنك إلغاء طلب شخص آخر", 403);
    if (leave.status !== LeaveRequestStatus.LEAVE_PENDING) {
      throw new AppError("لا يمكن إلغاء الطلب لأنه تمت معالجته بالفعل", 400);
    }

    return prisma.staffLeaveRequest.delete({
      where: { id: leaveId }
    });
  }
};
