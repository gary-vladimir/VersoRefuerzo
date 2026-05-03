// Server wrapper. Redirects to / ONLY when the session cookie cryptographically
// verifies — never on cookie presence alone. This prevents the
// /login ↔ / redirect loop that an expired or bogus cookie would otherwise
// trigger (middleware can't run Firebase Admin in the Edge runtime, so the
// redirect-when-signed-in check has to live here).

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import LoginClient from "./_client";

export default async function LoginPage() {
  const user = await getServerUser();
  if (user) redirect("/");
  return <LoginClient />;
}
