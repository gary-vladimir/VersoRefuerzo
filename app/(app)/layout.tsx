// Authed app shell. Every route under (app)/ flows through here.
//
// Two redirects:
//   1. No verified session  -> /login. A stale cookie is left in place on
//      purpose: Next only allows cookie writes in Route Handlers and Server
//      Actions, so deleting it here threw and replaced the redirect with the
//      error screen. /login ignores an unverifiable cookie and the next
//      sign-in overwrites it, so there is no redirect loop.
//   2. First-run user (hasCompletedOnboarding === false) -> /onboarding
//      (skipped if already on /onboarding, so the user can complete it)
//
// pathname is read from the `x-pathname` header set by middleware.ts.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerUser } from "@/lib/auth/session";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { T } from "@/lib/i18n/strings";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";

  const user = await getServerUser();
  if (!user) redirect("/login");
  if (!user.hasCompletedOnboarding && pathname !== "/onboarding") {
    redirect("/onboarding");
  }

  const dismissLabel = T[user.locale === "en" ? "en" : "es"].dismiss;

  // Onboarding lives outside the shell — it's a single full-screen step
  // before the user has anything to navigate to.
  if (pathname === "/onboarding") {
    return <ToastProvider dismissLabel={dismissLabel}>{children}</ToastProvider>;
  }

  return (
    <ToastProvider dismissLabel={dismissLabel}>
      <AppShell user={user}>{children}</AppShell>
    </ToastProvider>
  );
}
