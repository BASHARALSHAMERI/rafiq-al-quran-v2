import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { I18nProvider } from "./i18n";
import { queryClient } from "./query-client";
import { useApplyUi } from "./use-apply-ui";

type AppProvidersProps = {
  children: ReactNode;
};

function AppProviders({ children }: AppProvidersProps) {
  useApplyUi();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>{children}</I18nProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={12}
        containerStyle={{
          zIndex: 99999
        }}
        toastOptions={{
          className: "app-toast",
          duration: 4000,
          success: {
            className: "app-toast app-toast--success",
            duration: 3500,
            iconTheme: {
              primary: "var(--success-600, #10b981)",
              secondary: "var(--bg-surface-elevated, #fff)"
            }
          },
          error: {
            className: "app-toast app-toast--error",
            duration: 5000,
            iconTheme: {
              primary: "var(--error-600, #ef4444)",
              secondary: "var(--bg-surface-elevated, #fff)"
            }
          }
        }}
      />
    </QueryClientProvider>
  );
}

export default AppProviders;
