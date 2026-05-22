import { Role } from "@prisma/client";
import { AppError } from "../errors/app-error";
import type { ScopeContext } from "../types/auth.types";

type AssignmentSnapshot = {
  id: number;
  role: Role;
  organizationId: number;
  isActive: boolean;
  centerAccesses: Array<{ centerId: number }>;
  managedCenters: Array<{ id: number }>;
  centerSupervisorLinks: Array<{ centerId: number; isActive: boolean }>;
  circleAccesses: Array<{ circleId: number }>;
  taughtCircles: Array<{ id: number; centerId: number }>;
  parentLinks: Array<{ id: number; parentId: number; studentId: number }>;
  studentEnrollments: Array<{ circleId: number; circle: { centerId: number } }>;
};

const unique = (values: number[]): number[] => {
  return [...new Set(values)];
};

export const buildScopeFromAssignments = (snapshot: AssignmentSnapshot): ScopeContext => {
  if (!snapshot.isActive) {
    throw new AppError("Inactive user account", 403);
  }

  if (snapshot.role === Role.SUPER_ADMIN) {
    return {
      userId: snapshot.id,
      role: snapshot.role,
      organizationId: snapshot.organizationId,
      allAccess: true,
      centerIds: [],
      circleIds: [],
      studentIds: []
    };
  }

  const centerIds = unique([
    ...snapshot.centerAccesses.map((item) => item.centerId),
    ...snapshot.managedCenters.map((item) => item.id),
    ...snapshot.centerSupervisorLinks
      .filter((item) => item.isActive)
      .map((item) => item.centerId),
    ...snapshot.taughtCircles.map((item) => item.centerId),
    ...snapshot.studentEnrollments.map((item) => item.circle.centerId)
  ]);

  const circleIds = unique([
    ...snapshot.circleAccesses.map((item) => item.circleId),
    ...snapshot.taughtCircles.map((item) => item.id),
    ...snapshot.studentEnrollments.map((item) => item.circleId)
  ]);

  const studentIds =
    snapshot.role === Role.PARENT
      ? unique(snapshot.parentLinks.map((item) => item.studentId))
      : snapshot.role === Role.STUDENT
        ? [snapshot.id]
        : [];

  return {
    userId: snapshot.id,
    role: snapshot.role,
    organizationId: snapshot.organizationId,
    allAccess: false,
    centerIds,
    circleIds,
    studentIds
  };
};

export const mergeScope = (
  scope: ScopeContext,
  centerIds: number[],
  circleIds: number[]
): ScopeContext => {
  return {
    ...scope,
    centerIds: unique([...scope.centerIds, ...centerIds]),
    circleIds: unique([...scope.circleIds, ...circleIds])
  };
};

export const ensureCenterAllowed = (scope: ScopeContext, centerId: number): void => {
  if (scope.allAccess) {
    return;
  }

  if (!scope.centerIds.includes(centerId)) {
    throw new AppError("Access denied for requested center", 403);
  }
};

export const ensureCircleAllowed = (scope: ScopeContext, circleId: number): void => {
  if (scope.allAccess) {
    return;
  }

  if (!scope.circleIds.includes(circleId)) {
    throw new AppError("Access denied for requested circle", 403);
  }
};
