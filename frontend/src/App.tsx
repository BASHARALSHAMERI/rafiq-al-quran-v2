import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

import AppRouter from "./app/router";
import ErrorBoundary from "./app/ErrorBoundary";
import { useI18n } from "./app/i18n";
import AppSplash from "./components/entry/AppSplash";

const SPLASH_DURATION_MS = 2800;

function App() {
  const { language } = useI18n();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AppRouter key={`router-${language}`} />
      <AnimatePresence>{showSplash ? <AppSplash /> : null}</AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;
