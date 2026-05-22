import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "../app/i18n";
import { labels } from "../constants/labels";
import { useActivateAccountMutation, useValidateActivationTokenQuery } from "../features/auth/auth.hooks";
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

function ActivateAccountPage() {
  const { direction, language } = useI18n();
  const ar = language === "ar";
  const [searchParams] = useSearchParams();
  const activateMutation = useActivateAccountMutation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get("token") ?? "";
  
  // Validate token on mount
  const validateQuery = useValidateActivationTokenQuery(token, !!token);

  const strength = getPasswordStrength(newPassword);
  const strengthLabel = strengthLabels[language as "ar" | "en"][strength];

  const apiErrorMessage = useMemo(() => {
    if (!activateMutation.error) return "";
    return getLocalizedApiErrorMessage(activateMutation.error, {
      ar,
      fallback: ar ? "فشل تفعيل الحساب" : "Account activation failed"
    });
  }, [ar, activateMutation.error]);

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

    await activateMutation.mutateAsync({ token, newPassword });
    setIsSuccess(true);
  };

  const isLoading = validateQuery.isLoading;
  const isInvalid = !token || validateQuery.isError;
  const userData = validateQuery.data;

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

        {isLoading ? (
          <div className="auth-token-invalid">
             <div className="auth-token-invalid__icon animate-pulse">
              <UserCheck className="h-7 w-7 opacity-50" />
            </div>
            <p>{ar ? "جاري التحقق من الرابط..." : "Validating link..."}</p>
          </div>
        ) : isInvalid ? (
          /* ── Invalid token: show error card ── */
          <div className="auth-token-invalid">
            <div className="auth-token-invalid__icon">
              {userData?.alreadyActive ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              ) : (
                <ShieldAlert className="h-7 w-7" />
              )}
            </div>
            <h3>
              {userData?.alreadyActive 
                ? (ar ? "الحساب مفعل بالفعل!" : "Account Already Active!")
                : (ar ? "رابط التفعيل غير صالح" : "Invalid Activation Link")}
            </h3>
            <p>
              {userData?.alreadyActive
                ? (ar 
                    ? "هذا الحساب تم تفعيله مسبقاً. يمكنك تسجيل الدخول مباشرة باستخدام كلمة المرور الخاصة بك." 
                    : "This account has already been activated. You can log in directly using your password.")
                : (ar 
                    ? "الرابط غير صالح أو منتهي الصلاحية أو تم استخدامه بالفعل. يرجى التواصل مع الإدارة." 
                    : "The link is invalid, expired, or has already been used. Please contact administration.")}
            </p>

            <Link to="/login" className="auth-prime__submit-btn" style={{ textDecoration: "none", lineHeight: 1 }}>
              {labels.auth.login}
            </Link>
          </div>
        ) : isSuccess ? (
          /* ── Success Card ── */
          <div className="auth-success-card">
            <div className="auth-success-card__icon">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3>{ar ? "تم تفعيل حسابك بنجاح!" : "Account Activated Successfully!"}</h3>
            <p>{ar ? "لقد قمت بإعداد كلمة المرور الخاصة بك. يمكنك الآن تسجيل الدخول." : "You have successfully set up your password. You can now log in."}</p>

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
                <UserCheck className="h-8 w-8" />
              </div>
              <h2>{ar ? "تفعيل الحساب" : "Activate Account"}</h2>
              <p>
                {ar 
                  ? `مرحباً ${userData?.user?.fullName || ""}، يرجى إعداد كلمة المرور الخاصة بك لتفعيل الحساب.` 
                  : `Welcome ${userData?.user?.fullName || ""}, please set up your password to activate your account.`}
              </p>
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
                  activateMutation.isPending ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                style={{ marginTop: "0.5rem" }}
              >
                {activateMutation.isPending
                  ? "..."
                  : ar ? "تفعيل وإكمال الإعداد" : "Activate & Complete Setup"}
              </button>
            </form>
          </>
        )}
    </AuthLayout>
  );
}

export default ActivateAccountPage;
