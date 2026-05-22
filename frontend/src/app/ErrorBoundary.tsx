import { Component, type ErrorInfo, type ReactNode } from "react";
import { getLocalizedApiErrorMessage, normalizeApiError } from "../shared/api/error";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
  requestId?: string;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: "حدث خطأ غير متوقع."
  };

  private static isArabic() {
    return document.documentElement.lang !== "en";
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const ar = ErrorBoundary.isArabic();
    const fallback = ar
      ? "تعذر تحميل الصفحة الحالية. يرجى إعادة المحاولة."
      : "Unable to load this page. Please try again.";
    const normalized = normalizeApiError(error, fallback);
    const message = getLocalizedApiErrorMessage(error, {
      ar,
      fallback
    });

    return {
      hasError: true,
      message,
      requestId: normalized.requestId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ui.error.boundary", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const ar = ErrorBoundary.isArabic();
    const title = ar ? "حدث خطأ في التطبيق" : "Application error";
    const actionLabel = ar ? "إعادة تحميل الصفحة" : "Reload page";
    const requestIdLabel = ar ? "رقم الطلب" : "Request ID";

    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "var(--bg-canvas-gradient)"
        }}
      >
        <section
          style={{
            width: "min(560px, 100%)",
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "var(--shadow-3)"
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: "8px", color: "var(--text-primary)" }}>{title}</h1>
          <p style={{ marginTop: 0, marginBottom: "12px", color: "var(--text-secondary)" }}>
            {this.state.message}
          </p>
          {this.state.requestId ? (
            <p style={{ marginTop: 0, marginBottom: "12px", color: "var(--text-secondary)" }}>
              {requestIdLabel}: <code>{this.state.requestId}</code>
            </p>
          ) : null}
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              border: 0,
              borderRadius: "10px",
              background: "var(--bg-primary)",
              color: "var(--text-on-primary)",
              padding: "10px 14px",
              cursor: "pointer"
            }}
          >
            {actionLabel}
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
