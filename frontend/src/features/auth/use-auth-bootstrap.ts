import { useEffect } from "react";
import { useAuthStore } from "./auth.store";

export const useAuthBootstrap = () => {
  const hasBootstrapped = useAuthStore((state) => state.hasBootstrapped);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    if (!hasBootstrapped && !isBootstrapping) {
      void bootstrap();
    }
  }, [bootstrap, hasBootstrapped, isBootstrapping]);

  return {
    hasBootstrapped,
    isBootstrapping
  };
};