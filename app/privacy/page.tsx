// Public privacy page (spec §3.2 + §10.5). Locale follows the signed-in
// user when there is one, otherwise Spanish.

import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = { title: "Privacidad · VersoRefuerzo" };

export default async function PrivacyPage() {
  const user = await getServerUser();
  const locale: "es" | "en" = user?.locale === "en" ? "en" : "es";
  const t = T[locale];

  const paragraphs =
    locale === "es"
      ? [
          "VersoRefuerzo es 100% gratis y sin anuncios. No vendemos ni compartimos tus datos personales con terceros.",
          "Tu biblioteca de versos, colecciones, pistas y tu progreso son privados. Solo tú puedes verlos; ningún otro usuario tiene acceso a ellos.",
          "El inicio de sesión con Google se usa únicamente para identificar tu cuenta mediante tu nombre, correo y foto de perfil. Nunca publicamos nada en tu nombre.",
          "No utilizamos analíticas que envíen el contenido de tus versos fuera de tu dispositivo.",
          "Puedes eliminar tu cuenta cuando quieras desde tu perfil. Al hacerlo borramos de forma permanente tus versos, colecciones y sesiones de práctica.",
          "El texto bíblico proviene de API.Bible y se guarda en una caché compartida que no contiene ningún dato personal.",
        ]
      : [
          "VersoRefuerzo is 100% free and ad-free. We never sell or share your personal data with third parties.",
          "Your verse library, collections, hints, and progress are private. Only you can see them; no other user has access.",
          "Google sign-in is used solely to identify your account via your name, email, and profile photo. We never post anything on your behalf.",
          "We do not use analytics that send the content of your verses off your device.",
          "You can delete your account at any time from your profile. Doing so permanently removes your verses, collections, and practice sessions.",
          "Bible text is sourced from API.Bible and stored in a shared cache that holds no personal data.",
        ];

  return (
    <LegalPage
      title={locale === "es" ? "Privacidad" : "Privacy"}
      paragraphs={paragraphs}
      backHref={user ? "/" : "/login"}
      backLabel={t.backToCollection}
    />
  );
}
