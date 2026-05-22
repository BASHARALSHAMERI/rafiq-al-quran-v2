import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { labels } from "../../constants/labels";
import { useMeQuery } from "../../features/auth/auth.hooks";
import { useAuthStore } from "../../features/auth/auth.store";
import { useAuthBootstrap } from "../../features/auth/use-auth-bootstrap";
import PageState from "../../shared/ui/PageState";

function RequireAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { hasBootstrapped, isBootstrapping } = useAuthBootstrap();

  const meQuery = useMeQuery(hasBootstrapped && Boolean(accessToken));

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.isError) {
      // If profile fetch fails, the token is likely invalid or session expired.
      clearAuth();
    }
  }, [clearAuth, meQuery.isError]);

  if (!hasBootstrapped || isBootstrapping) {
    return (
      <PageState
        title={labels.states.checkingSession}
        description={labels.states.pleaseWait}
      />
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (!user && meQuery.isPending) {
    return (
      <PageState
        title={labels.states.loadingProfile}
        description={labels.states.pleaseWait}
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
