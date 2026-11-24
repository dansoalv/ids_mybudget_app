"use client";

import { useEffect } from "react";

import { flushTransactionQueue } from "@/lib/offline/queue";

export function PwaProvider() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js");

    const synchronize = () => void flushTransactionQueue();
    window.addEventListener("online", synchronize);
    if (navigator.onLine) synchronize();

    return () => window.removeEventListener("online", synchronize);
  }, []);

  return null;
}
