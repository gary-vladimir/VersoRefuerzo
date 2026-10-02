import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display-loaded",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const serif = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-loaded",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VersoRefuerzo",
  description: "Memoriza la Palabra. Una tarjeta a la vez.",
  // The app is designed light-only, with its own dark login and summary
  // screens (specs.md §7.8). Dark Reader and similar extensions repaint it
  // anyway: dark boxes behind the logo and headings, a dark Google button.
  // This tag tells Dark Reader to leave the page alone.
  other: { "darkreader-lock": "true" },
};

// viewportFit: "cover" is what activates env(safe-area-inset-*) on notched
// devices — without it every safe-area helper in the app is a no-op. We
// deliberately do NOT lock zoom (maximumScale / userScalable) so the app
// stays accessible to low-vision users.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf9fe",
  // Tell the browser the page is light, so it does not apply its own
  // automatic dark-mode recoloring to form controls and backgrounds.
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${sans.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
