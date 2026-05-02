// Home placeholder for M1.
// Replaced by the real ScreenHome (verses-first feed, hero CTA, streak chip) in M3/M4.

import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import SignOutButton from "./_signout-button";

export default async function Home() {
  // Layout already verified the session; calling again is a no-op (memoized).
  const user = await getServerUser();
  if (!user) return null;
  const t = T[user.locale === "en" ? "en" : "es"];
  const firstName = user.displayName.split(" ")[0] ?? user.displayName;

  return (
    <main
      style={{
        padding: "var(--s-7)",
        maxWidth: 720,
        margin: "0 auto",
        minHeight: "100dvh",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 32,
          margin: 0,
          color: "var(--c-text)",
          letterSpacing: "-0.6px",
        }}
      >
        {t.helloName(firstName)}
      </h1>
      <p
        style={{
          marginTop: "var(--s-3)",
          color: "var(--c-muted)",
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 16,
        }}
      >
        M1 placeholder. La pantalla real de Inicio llega en M3 / M4.
      </p>

      <SignOutButton label={t.signOut} />
    </main>
  );
}
