"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "queueing:theme";
const DEFAULT: Theme = "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT;
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? DEFAULT;
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(DEFAULT);

  // Sync from localStorage on mount (after hydration).
  useEffect(() => {
    const stored = getInitialTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
