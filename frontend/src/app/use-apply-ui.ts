import { useEffect } from "react";
import { useUiStore } from "./ui.store";

export const useApplyUi = () => {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    if (window.location.hostname === "127.0.0.1") {
      const url = new URL(window.location.href);
      url.hostname = "localhost";
      window.location.replace(url.toString());
      return;
    }

    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
};
