import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Restart Trigger v1.0.2

const featureChunkRules: Array<{ chunk: string; patterns: string[] }> = [
  {
    chunk: "feature-insights",
    patterns: [
      "/src/pages/ReportsPage",
      "/src/features/reports",
      "/src/pages/FinancePage",
      "/src/features/finance-v2"
    ]
  },
  {
    chunk: "feature-audit",
    patterns: ["/src/pages/AuditPage", "/src/features/audit"]
  },
  {
    chunk: "feature-exams",
    patterns: ["/src/pages/ExamsPage", "/src/features/exams"]
  },
  {
    chunk: "feature-library",
    patterns: ["/src/pages/LibraryPage", "/src/features/library"]
  }
];

const resolveManualChunk = (id: string) => {
  if (id.includes("node_modules")) {
    if (
      id.includes("/react/") ||
      id.includes("/react-dom/") ||
      id.includes("react-router-dom")
    ) {
      return "vendor-react";
    }

    if (id.includes("@tanstack/react-query") || id.includes("axios") || id.includes("zustand")) {
      return "vendor-data";
    }

    if (id.includes("framer-motion") || id.includes("lucide-react")) {
      return "vendor-ui";
    }

    return "vendor-react";
  }

  for (const rule of featureChunkRules) {
    if (rule.patterns.some((pattern) => id.includes(pattern))) {
      return rule.chunk;
    }
  }

  return undefined;
};

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: resolveManualChunk
      }
    }
  }
});
