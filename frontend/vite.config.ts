import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Restart Trigger v1.0.2

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

    return undefined;
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
