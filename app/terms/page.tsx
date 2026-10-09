// Public terms page (spec §10.5). Both languages are sent; the
// page shows the account's language when signed in, otherwise the one chosen
// on this device, and has its own language switch.

import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { LegalPage } from "@/components/legal/LegalPage";
import { LocaleProvider } from "@/components/i18n/LanguageToggle";

export const metadata = { title: "Términos · VersoRefuerzo" };

const CONTENT = {
  es: {
    title: "Términos",
    paragraphs: [
      "VersoRefuerzo es un proyecto sin fines de lucro, ofrecido de forma gratuita y 'tal cual', sin garantías de ningún tipo.",
      "El texto bíblico proviene de API.Bible y se muestra junto con su atribución de derechos de autor correspondiente.",
      "Te pedimos usar la app de manera responsable. Podemos limitar el uso abusivo que ponga en riesgo el servicio para las demás personas.",
      "Estos términos pueden actualizarse con el tiempo; cualquier cambio se reflejará en esta página.",
    ],
  },
  en: {
    title: "Terms",
    paragraphs: [
      "VersoRefuerzo is a non-commercial project, offered free of charge and 'as is', without warranties of any kind.",
      "Bible text is sourced from API.Bible and shown together with its corresponding copyright attribution.",
      "Please use the app responsibly. We may limit abusive use that puts the service at risk for others.",
      "These terms may be updated over time; any changes will be reflected on this page.",
    ],
  },
};

export default async function TermsPage() {
  const user = await getServerUser();
  const page = (
    <LegalPage
      content={CONTENT}
      backHref={user ? "/" : "/login"}
      backLabel={{ es: T.es.backToCollection, en: T.en.backToCollection }}
    />
  );
  return user ? (
    <LocaleProvider locale={user.locale === "en" ? "en" : "es"}>{page}</LocaleProvider>
  ) : (
    page
  );
}
