import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "../app/i18n";
import { labels } from "../constants/labels";
import { useResetPasswordMutation } from "../features/auth/auth.hooks";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import AuthLayout from "../components/auth/AuthLayout";

// ─── Password Strength Helpers ───────────────────────────────────────────────

function getPasswordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

const strengthLabels: Record<"ar" | "en", Record<0 | 1 | 2 | 3 | 4, string>> = {
  ar: {
    0: "",
    1: "ضعيفة",
    2: "مقبولة",
    3: "جيدة",
    4: "قوية",
  },
  en: {
    0: "",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

function ResetPasswordPage() {
  const { direction, language } = useI18n();
  const ar = language === "ar";
  const [searchParams] = useSearchParams();
  const resetPasswordMutation = useResetPasswordMutation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get("token") ?? "";
  const hasValidToken = Boolean(token.trim());

  const strength = getPasswordStrength(newPassword);
  const strengthLabel = strengthLabels[language as "ar" | "en"][strength];

  const apiErrorMessage = useMemo(() => {
    if (!resetPasswordMutation.error) return "";
    return getLocalizedApiErrorMessage(resetPasswordMutation.error, {
      ar,
      fallback: labels.auth.resetPasswordError
    });
  }, [ar, resetPasswordMutation.error]);

  const errorMessage = localError || apiErrorMessage;

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (newPassword.length < 8) {
      setLocalError(labels.auth.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError(labels.auth.passwordMismatch);
      return;
    }

    await resetPasswordMutation.mutateAsync({ token, newPassword });
    setIsSuccess(true);
  };

  return (
    <AuthLayout direction={direction}>
      {/* Back to Login */}
      <Link to="/login" className="auth-back-link" dir={direction} style={{ marginBottom: "1.5rem" }}>
        {direction === "rtl" ? (
          <ArrowRight className="h-4 w-4" />
        ) : (
          <ArrowLeft className="h-4 w-4" />
        )}
        <span>{labels.auth.backToLogin}</span>
      </Link>

      {/* ── No token: show error card ── */}
      {!hasValidToken ? (
        <div className="auth-token-invalid">
          <div className="auth-token-invalid__icon">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h3>{labels.auth.resetLinkInvalid}</h3>
          <p>{ar ? "الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد." : "The link is invalid or has expired. Please request a new one."}</p>

          <Link to="/forgot-password" className="auth-prime__submit-btn" style={{ textDecoration: "none", lineHeight: 1 }}>
            {labels.auth.forgotPasswordTitle}
          </Link>
        </div>
      ) : isSuccess ? (
        /* ── Success Card ── */
        <div className="auth-success-card">
          <div className="auth-success-card__icon">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3>{ar ? "تم تحديث كلمة المرور!" : "Password updated!"}</h3>
          <p>{labels.auth.resetPasswordSuccess}</p>

          <Link to="/login" className="auth-prime__submit-btn" style={{ textDecoration: "none", lineHeight: 1 }}>
            {labels.auth.login}
          </Link>
        </div>
      ) : (
        /* ── Form ── */
        <>
          {/* Page Heading */}
          <div className="auth-page-heading">
            <div className="auth-page-heading__icon">
              <KeyRound className="h-8 w-8" />
            </div>
            <h2>{labels.auth.resetPasswordTitle}</h2>
            <p>{labels.auth.resetPasswordHint}</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-prime__form"
            style={{ marginTop: "1.5rem" }}
          >
            {/* New Password */}
            <label className="auth-prime__field">
              <span>{labels.auth.password}</span>
              <div className="auth-prime__input">
                <Lock className="h-5 w-5" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setLocalError("");
                  }}
                  placeholder={labels.auth.password}
                  autoComplete="new-password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="auth-prime__password-toggle"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? labels.auth.hidePassword : labels.auth.showPassword}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {/* Password Strength Bar */}
            {newPassword.length > 0 && (
              <div className="auth-password-strength">
                <div className="auth-password-strength__bars">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="auth-password-strength__bar"
                      data-active={strength >= level ? strength : undefined}
                    />
                  ))}
                </div>
                <span
                  className="auth-password-strength__label"
                  data-level={strength > 0 ? strength : undefined}
                >
                  {strengthLabel}
                </span>
              </div>
            )}

            {/* Confirm Password */}
            <label className="auth-prime__field">
              <span>{labels.auth.confirmPassword}</span>
              <div className="auth-prime__input">
                <Lock className="h-5 w-5" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setLocalError("");
                  }}
                  placeholder={labels.auth.confirmPassword}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-prime__password-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? labels.auth.hidePassword : labels.auth.showPassword}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {/* Confirm Match Inline Hint */}
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p style={{ fontSize: "0.8rem", color: "#fca5a5", margin: "-0.4rem 0 0" }}>
                {labels.auth.passwordMismatch}
              </p>
            )}

            {/* Error */}
            {errorMessage && (
              <div className="auth-error" role="alert">
                <AlertCircle className="h-5 w-5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-prime__submit-btn"
              disabled={
                resetPasswordMutation.isPending ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              style={{ marginTop: "0.5rem" }}
            >
              {resetPasswordMutation.isPending
                ? "..."
                : labels.auth.resetPasswordSubmit}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export default ResetPasswordPage;
