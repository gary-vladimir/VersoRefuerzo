"use client";

// Route-level error boundary. Catches anything thrown while rendering a
// page or server component under the root layout — a Neon timeout, an
// API.Bible outage during a cache miss, a bad cookie — and replaces Next's
// default white screen with a recoverable card.
//
// `reset()` re-renders the failed segment without a full reload, which is
// usually enough for a transient database hiccup.

import { useEffect } from "react";
import { T } from "@/lib/i18n/strings";
import { MessageScreen } from "@/components/ui/MessageScreen";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Cloud Run collects stderr, so this is what makes a production failure
    // traceable back to the digest Next shows the user.
    console.error("route error", { digest: error.digest, message: error.message });
  }, [error]);

  const t = T.es;

  return (
    <MessageScreen
      title={t.errorTitle}
      body={t.errorBody}
      detail={process.env.NODE_ENV === "development" ? error.message : null}
      action={{ label: t.errorRetry, onClick: reset }}
      homeLabel={t.errorHome}
    />
  );
}
