import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { useI18n } from "../app/i18n";
import { getRoleLandingPath } from "../app/role-landing";
import { labels } from "../constants/labels";
import { useLoginMutation, useMeQuery } from "../features/auth/auth.hooks";
import { useAuthStore } from "../features/auth/auth.store";
import { useAuthBootstrap } from "../features/auth/use-auth-bootstrap";

import { normalizeApiError } from "../shared/api/error";
import AuthLayout from "../components/auth/AuthLayout";

const REMEMBER_IDENTIFIER_KEY = "rafiq_v2_login_identifier";

function LoginPage() {
  const { direction } = useI18n();
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { hasBootstrapped } = useAuthBootstrap();
  const meQuery = useMeQuery(hasBootstrapped && Boolean(accessToken));
  const loginMutation = useLoginMutation();

  // Branding data is now handled centrally in AuthLayout

  const rememberedIdentifier =
    typeof window === "undefined" ? "" : window.localStorage.getItem(REMEMBER_IDENTIFIER_KEY) ?? "";

  const [identifier, setIdentifier] = useState(rememberedIdentifier);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedIdentifier));
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (meQuery.data && !user) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser, user]);

  useEffect(() => {
    if (meQuery.isError) {
      clearAuth();
    }
  }, [clearAuth, meQuery.isError]);

  const isPending = loginMutation.isPending;
  const errorMessage = useMemo(() => {
    if (!loginMutation.error) {
      return "";
    }

    const normalized = normalizeApiError(loginMutation.error, labels.auth.loginFailed);

    if (normalized.code === "AUTH_ACCOUNT_NOT_ACTIVE") {
      return labels.auth.accountNotActive;
    }
    
    if (normalized.code === "AUTH_FORBIDDEN_PLATFORM") {
      return normalized.message || labels.auth.webAdminOnly;
    }

    if (normalized.status === 401) {
      return labels.auth.invalidCredentials;
    }

    if (!normalized.status) {
      return labels.auth.backendUnavailable;
    }

    return normalized.message || labels.auth.loginFailed;
  }, [loginMutation.error]);

  if (user && accessToken) {
    return <Navigate to={getRoleLandingPath(user.role)} replace />;
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const trimmedIdentifier = identifier.trim();
    if (rememberMe && trimmedIdentifier) {
      window.localStorage.setItem(REMEMBER_IDENTIFIER_KEY, trimmedIdentifier);
    } else {
      window.localStorage.removeItem(REMEMBER_IDENTIFIER_KEY);
    }

    try {
      const session = await loginMutation.mutateAsync({ identifier: trimmedIdentifier, password });
      navigate(getRoleLandingPath(session.user.role), { replace: true });
    } catch {
      // Error state is rendered from the mutation object above.
    }
  };

  return (
    <AuthLayout direction={direction}>
      <header className="auth-prime__header">
        <h2>{labels.auth.loginTitle}</h2>
        <p>{labels.auth.loginHint}</p>
      </header>

      <form onSubmit={handleSubmit} className="auth-prime__form">
        <label className="auth-prime__field">
          <span>{labels.auth.identifier}</span>
          <div className="auth-prime__input">
            <UserRound className="h-5 w-5" />
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={labels.auth.identifier}
              autoComplete="username"
              required
              autoFocus
            />
          </div>
        </label>

        <label className="auth-prime__field">
          <span>{labels.auth.password}</span>
          <div className="auth-prime__input">
            <Lock className="h-5 w-5" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={labels.auth.password}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="auth-prime__password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? labels.auth.hidePassword : labels.auth.showPassword}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </label>

        {errorMessage && (
          <div className="auth-error" role="alert">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="auth-prime__meta">
          <label className="auth-prime__remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>{labels.auth.rememberMe}</span>
          </label>

          <Link to="/forgot-password" className="auth-prime__forgot">
            {labels.auth.forgotPassword}
          </Link>
        </div>

        <button
          type="submit"
          className="auth-prime__submit-btn"
          disabled={isPending}
        >
          {isPending ? labels.auth.loggingIn : labels.auth.login}
          {isPending ? undefined : (
            direction === "rtl" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
