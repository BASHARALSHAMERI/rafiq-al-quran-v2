import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

import AppRouter from "./app/router";
import ErrorBoundary from "./app/ErrorBoundary";

import AppSplash from "./components/entry/AppSplash";

const SPLASH_DURATION_MS = 600;

function App() {
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
      <AppRouter />
      <AnimatePresence>{showSplash ? <AppSplash /> : null}</AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;
