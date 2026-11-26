"use client";

import { useEffect } from "react";

import { flushTransactionQueue } from "@/lib/offline/queue";

export function PwaProvider() {
  useEffect(() => {
    const updateVisualViewport = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;

      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        `${height}px`,
      );
      document.documentElement.style.setProperty(
        "--visual-viewport-top",
        `${offsetTop}px`,
      );
    };

    updateVisualViewport();
    window.addEventListener("resize", updateVisualViewport);
    window.addEventListener("orientationchange", updateVisualViewport);
    window.visualViewport?.addEventListener("resize", updateVisualViewport);
    window.visualViewport?.addEventListener("scroll", updateVisualViewport);

    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        void navigator.serviceWorker.register("/sw.js");
      } else {
        void navigator.serviceWorker.getRegistration("/").then((registration) => registration?.unregister());
        if ("caches" in window) {
          void caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key.startsWith("mybudget-")).map((key) => caches.delete(key)),
          ));
        }
      }
    }

    const synchronize = () => void flushTransactionQueue();
    window.addEventListener("online", synchronize);
    if (navigator.onLine) synchronize();

    return () => {
      window.removeEventListener("resize", updateVisualViewport);
      window.removeEventListener("orientationchange", updateVisualViewport);
      window.visualViewport?.removeEventListener("resize", updateVisualViewport);
      window.visualViewport?.removeEventListener("scroll", updateVisualViewport);
      window.removeEventListener("online", synchronize);
    };
  }, []);

  return null;
}
