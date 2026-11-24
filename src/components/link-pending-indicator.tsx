"use client";

import { useLinkStatus } from "next/link";

export function LinkPendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`link-pending-indicator ${pending ? "is-pending" : ""}`}
    />
  );
}
