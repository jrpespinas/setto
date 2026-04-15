"use client";

import { useEffect } from "react";

/** Register the Serwist-generated service worker for offline resilience.
 *  Only runs in the browser, only when the window is secure. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    const controller = new AbortController();
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch {
        // swallow — PWA degrades gracefully to regular network usage.
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true, signal: controller.signal });
    }
    return () => controller.abort();
  }, []);

  return null;
}
