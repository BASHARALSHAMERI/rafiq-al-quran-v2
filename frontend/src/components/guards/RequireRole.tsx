import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ADMIN_ROUTE_BY_ID, type AdminRouteId } from "../../app/route-meta";
import { useAuthStore } from "../../features/auth/auth.store";
import type { Role } from "../../features/auth/types";

type RequireRoleProps = {
  routeId?: AdminRouteId;
  allowedRoles?: Role[];
  children: ReactNode;
};

function RequireRole({ routeId, allowedRoles, children }: RequireRoleProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const resolvedAllowedRoles =
    routeId && ADMIN_ROUTE_BY_ID[routeId]
      ? ADMIN_ROUTE_BY_ID[routeId].allowedRoles
      : (allowedRoles ?? []);

  if (!resolvedAllowedRoles.includes(user.role)) {
    console.warn(`[Guard] Illegal access attempt to route ${routeId} by role ${user.role}`);
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

export default RequireRole;
