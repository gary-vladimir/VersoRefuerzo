// Authed app shell. Every route under (app)/ flows through here.
//
// Two redirects:
//   1. No verified session  -> /login (and clear the stale cookie so the
//      browser doesn't keep re-presenting it on every refresh)
//   2. First-run user (hasCompletedOnboarding === false) -> /onboarding
//      (skipped if already on /onboarding, so the user can complete it)
//
// pathname is read from the `x-pathname` header set by middleware.ts.

import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { getServerUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";

  const user = await getServerUser();
  if (!user) {
    const store = await cookies();
    if (store.get("__session")) store.delete("__session");
    redirect("/login");
  }
  if (!user.hasCompletedOnboarding && pathname !== "/onboarding") {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
