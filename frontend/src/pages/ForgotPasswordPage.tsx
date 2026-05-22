import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, KeyRound, MailCheck, UserRound } from "lucide-react";
import { useI18n } from "../app/i18n";
import { labels } from "../constants/labels";
import { useForgotPasswordMutation } from "../features/auth/auth.hooks";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import AuthLayout from "../components/auth/AuthLayout";

function ForgotPasswordPage() {
  const { direction, language } = useI18n();
  const ar = language === "ar";
  const forgotPasswordMutation = useForgotPasswordMutation();

  const [identifier, setIdentifier] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const isPending = forgotPasswordMutation.isPending;

  const errorMessage = useMemo(() => {
    if (!forgotPasswordMutation.error) return "";
    return getLocalizedApiErrorMessage(forgotPasswordMutation.error, {
      ar,
      fallback: labels.auth.forgotPasswordError
    });
  }, [ar, forgotPasswordMutation.error]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    await forgotPasswordMutation.mutateAsync({ identifier: identifier.trim() });
    setIsSuccess(true);
  };

  return (
    <AuthLayout direction={direction}>
      {/* Back to Login */}
      <Link
        to="/login"
        className="auth-back-link"
        dir={direction}
        style={{ marginBottom: "1.5rem" }}
      >
        {direction === "rtl" ? (
          <ArrowRight className="h-4 w-4" />
        ) : (
          <ArrowLeft className="h-4 w-4" />
        )}
        <span>{labels.auth.backToLogin}</span>
      </Link>

      {isSuccess ? (
        /* ── Success State ── */
        <div className="auth-success-card">
          <div className="auth-success-card__icon">
            <MailCheck className="h-10 w-10" />
          </div>
          <h3>{labels.auth.forgotPasswordTitle}</h3>
          <p>{labels.auth.forgotPasswordSuccess}</p>

          <Link to="/login" className="auth-prime__submit-btn" style={{ textDecoration: "none", lineHeight: 1 }}>
            {labels.auth.backToLogin}
          </Link>
        </div>
      ) : (
        /* ── Form State ── */
        <>
          {/* Page Heading */}
          <div className="auth-page-heading">
            <div className="auth-page-heading__icon">
              <KeyRound className="h-8 w-8" />
            </div>
            <h2>{labels.auth.forgotPasswordTitle}</h2>
            <p>{labels.auth.forgotPasswordHint}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-prime__form" style={{ marginTop: "1.5rem" }}>
            <label className="auth-prime__field">
              <span>{labels.auth.identifier}</span>
              <div className="auth-prime__input">
                <UserRound className="h-5 w-5" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={labels.auth.identifier}
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
            </label>

            {errorMessage && (
              <div className="auth-error" role="alert">
                <AlertCircle className="h-5 w-5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-prime__submit-btn"
              disabled={isPending || !identifier.trim()}
              style={{ marginTop: "0.5rem" }}
            >
              {isPending ? "..." : labels.auth.forgotPasswordSubmit}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
