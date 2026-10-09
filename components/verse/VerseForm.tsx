"use client";

// New Verse form (specs.md §6.1, §17.1).
// Live preview at the top, six fields below, sticky save button.
// Reference parsing happens client-side (specs §9.2): green check on valid,
// inline error otherwise. Save is disabled until valid.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseReference } from "@/lib/bible/reference";
import {
  type CardColorId,
  type CollectionColorId,
  type VerseIconId,
  isVerseIcon,
  VERSION_NAMES,
  type VersionId,
  textLocaleForVersion,
} from "@/lib/catalog";
import { defaultColorForIndex, defaultIconForBook } from "@/lib/bible/defaults";
import { VerseCard } from "@/components/ui/VerseCard";
import { MobileLanguageToggle } from "@/components/i18n/LanguageToggle";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { CollectionPicker } from "./CollectionPicker";
import { Check, AlertCircle, Bulb, Close, BookSmall, Chevron } from "@/components/icons/UiIcons";
import Link from "next/link";
import type { Collection } from "@/db/schema";
import type { StringTable } from "@/lib/i18n/strings";

export type VerseFormStrings = Pick<
  StringTable,
  | "newVerse"
  | "reference"
  | "version"
  | "icon"
  | "color"
  | "hint"
  | "hintPlaceholder"
  | "collections"
  | "save"
  | "cancel"
>;

export type VerseFormProps = {
  locale: "es" | "en";
  mode?: "create" | "edit";
  verseId?: string; // required when mode === 'edit'
  initialReference?: string;
  initialVersion?: string;
  initialColor?: CardColorId;
  initialIcon?: VerseIconId;
  initialHint?: string;
  initialCollectionIds?: string[];
  versions: string[]; // runtime allowlist intersection (§9.2)
  initialCollections: Collection[];
  existingVerseCount: number;
  headerTitle?: string;
  submitLabel?: string;
  strings: VerseFormStrings;
};

export function VerseForm({
  locale,
  mode = "create",
  verseId,
  initialReference = "",
  initialVersion,
  initialColor,
  initialIcon,
  initialHint = "",
  initialCollectionIds = [],
  versions,
  initialCollections,
  existingVerseCount,
  headerTitle,
  submitLabel,
  strings: t,
}: VerseFormProps) {
  const router = useRouter();
  const msg = FORM_MESSAGES[locale];
  const [refInput, setRefInput] = useState(initialReference);
  const [version, setVersion] = useState<string>(
    initialVersion && versions.includes(initialVersion)
      ? initialVersion
      : versions[0] ?? "",
  );
  // Switching the interface language re-renders the page with that
  // language's default version (NIV for English); follow it without
  // clearing what the user already typed.
  useEffect(() => {
    if (initialVersion && versions.includes(initialVersion)) setVersion(initialVersion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVersion]);
  const [color, setColor] = useState<CardColorId>(
    initialColor ?? defaultColorForIndex(existingVerseCount),
  );
  // Icon has an effect that overrides on book-change; track user intent so we
  // stop overriding once they've picked one explicitly. In edit mode we
  // start as "touched" so the existing icon is never silently overridden.
  const [icon, setIcon] = useState<VerseIconId>(initialIcon ?? "bible");
  const [iconTouched, setIconTouched] = useState(!!initialIcon || mode === "edit");
  const [hint, setHint] = useState(initialHint);
  const [collectionIds, setCollectionIds] = useState<string[]>(initialCollectionIds);
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Parse the reference live. `parsed` is null when invalid/empty.
  const parsed = useMemo(() => parseReference(refInput, locale), [refInput, locale]);

  // Live preview of the verse text, so the user sees exactly what they are
  // about to memorize before saving. Waits for typing to pause (a half-typed
  // "Juan 3:1" on the way to "Juan 3:16" is itself valid) and goes through
  // /api/bible/text, i.e. the shared cache: the save that follows is then
  // instant and API.Bible is called at most once per passage and version.
  const [preview, setPreview] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "ready"; text: string; copyright: string | null }
    | { state: "error" }
  >({ state: "idle" });
  const canonical = parsed?.canonical ?? null;
  useEffect(() => {
    if (!canonical || !version) {
      setPreview({ state: "idle" });
      return;
    }
    setPreview({ state: "loading" });
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/bible/text?ref=${encodeURIComponent(canonical)}&version=${encodeURIComponent(version)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) throw new Error(String(res.status));
        const j = (await res.json()) as { text: string; copyrightAttribution: string | null };
        setPreview({ state: "ready", text: j.text, copyright: j.copyrightAttribution });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setPreview({ state: "error" });
      }
    }, 450);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [canonical, version]);

  // Smart defaults for icon: if the parsed book has a default and the user
  // hasn't picked one, use it.
  useEffect(() => {
    if (!iconTouched && parsed) {
      const def = defaultIconForBook(parsed.bookCode);
      if (isVerseIcon(def)) setIcon(def);
    }
  }, [parsed, iconTouched]);

  const refDisplay = parsed?.display[locale] ?? (refInput || "Juan 14:6");

  const canSave = !!parsed && !!version && !submitting;

  async function createCollection(name: string, colorKey: CollectionColorId): Promise<Collection> {
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, colorKey }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(
        j.error === "duplicate_name" ? msg.duplicateCollection : msg.createCollectionFailed,
      );
    }
    const { collection } = (await res.json()) as { collection: Collection };
    setCollections((prev) => [...prev, collection].sort((a, b) => a.name.localeCompare(b.name)));
    return collection;
  }

  async function submit() {
    if (!parsed || !version) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const isEdit = mode === "edit" && verseId;
      const url = isEdit ? `/api/verses/${verseId}` : "/api/verses";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          canonicalRef: parsed.canonical,
          version,
          icon,
          color,
          hint: hint.trim() || null,
          collectionIds,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(errorMessage(j.error));
      }
      // Persist last-used version (specs §17.1) — best effort, create only.
      if (!isEdit) {
        fetch("/api/me", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lastVersion: version }),
        }).catch(() => {});
      }
      router.push(isEdit && verseId ? `/verses/${verseId}` : "/");
      router.refresh();
    } catch (e) {
      // A thrown fetch (offline) has no API error code behind it.
      setSubmitError(e instanceof TypeError ? msg.network : e instanceof Error ? e.message : msg.generic);
      setSubmitting(false);
    }
  }

  // API error codes are for code, not people.
  function errorMessage(code: unknown): string {
    switch (code) {
      case "version_unavailable":
        return msg.versionUnavailable;
      case "invalid_collection":
        return msg.invalidCollection;
      case "not_found":
        return msg.notFound;
      default:
        return msg.generic;
    }
  }

  return (
    <main
      style={{
        background: "var(--c-bg)",
        minHeight: "100dvh",
        paddingBottom: "calc(120px + env(safe-area-inset-bottom))",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "16px 20px 12px",
          background: "#fff",
          borderBottom: "1px solid var(--c-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Equal-width side slots keep the title centered. */}
        <div style={{ width: 88 }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t.cancel}
            className="vr-press"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--c-bg)",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--c-text)",
            }}
          >
            <Close size={18} />
          </button>
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: "-0.2px",
            color: "var(--c-text)",
          }}
        >
          {headerTitle ?? t.newVerse}
        </h1>
        <div style={{ width: 88, display: "flex", justifyContent: "flex-end" }}>
          <MobileLanguageToggle />
        </div>
      </header>

      {/* Live preview */}
      <section
        style={{
          padding: "24px 20px 28px",
          display: "flex",
          justifyContent: "center",
          background: `linear-gradient(180deg, var(--card-${color}-tint) 0%, var(--c-bg) 100%)`,
          transition: "background .4s ease",
        }}
      >
        <div className="vr-card-swap" key={`${color}-${icon}`}>
          <VerseCard
            refDisplay={refDisplay}
            version={version || "—"}
            color={color}
            icon={icon}
            size="md"
          />
        </div>
      </section>

      {/* Form fields */}
      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        {/* What this screen is for: friends opening it for the first time
            did not know what a "reference" was or what happens next. */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            padding: "14px 16px",
            borderRadius: "var(--r-xl)",
            background: `var(--card-${color}-tint)`,
            boxShadow: `inset 0 0 0 1px rgb(var(--card-${color}-rgb) / 0.18)`,
          }}
        >
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: 10,
              background: `var(--card-${color}-bg)`,
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookSmall size={18} />
          </span>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c-text)" }}>
            {msg.intro}{" "}
            <Link
              href="/guide"
              style={{ color: `var(--card-${color}-solid)`, fontWeight: 700, textDecoration: "underline" }}
            >
              {msg.guideLink}
            </Link>
          </div>
        </div>

        {/* Reference */}
        <div>
          <FormLabel htmlFor="vr-ref-input">{t.reference}</FormLabel>
          <div
            className="vr-field"
            style={{
              background: "#fff",
              borderRadius: "var(--r-lg)",
              padding: "12px 14px",
              boxShadow: parsed
                ? `inset 0 0 0 2px var(--card-${color}-solid)`
                : refInput
                  ? "inset 0 0 0 2px #EF4444"
                  : "inset 0 0 0 1.5px var(--c-line)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "box-shadow .25s",
            }}
          >
            <input
              id="vr-ref-input"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder={locale === "es" ? "Juan 14:6" : "John 14:6"}
              style={{
                flex: 1,
                border: "none",
                fontSize: 16,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--c-text)",
                background: "transparent",
              }}
              aria-invalid={!!refInput && !parsed}
              aria-describedby="ref-status"
            />
            {parsed ? (
              <span
                id="ref-status"
                aria-label="ok"
                className="vr-pop"
                key={parsed.canonical}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#10B981",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={13} color="#fff" strokeWidth={3.5} />
              </span>
            ) : refInput ? (
              <span id="ref-status" aria-label="invalid" style={{ color: "#EF4444" }}>
                <AlertCircle size={20} />
              </span>
            ) : null}
          </div>
          {refInput && !parsed && (
            <p style={{ marginTop: 6, fontSize: 12, color: "#B91C1C" }}>
              {msg.invalidRef}
            </p>
          )}
        </div>

        {/* Version */}
        <div>
          <FormLabel htmlFor="vr-version-select">{t.version}</FormLabel>
          {versions.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
              {locale === "es"
                ? "No hay versiones disponibles. Configura APIBIBLE_ID_*."
                : "No versions available. Configure APIBIBLE_ID_*."}
            </p>
          ) : (
            // A dropdown with the full names reads better than a row of
            // abbreviations, and keeps working as more versions are added.
            <div className="vr-field" style={{ position: "relative" }}>
              <select
                id="vr-version-select"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                style={{
                  width: "100%",
                  appearance: "none",
                  WebkitAppearance: "none",
                  border: "none",
                  borderRadius: "var(--r-lg)",
                  padding: "13px 42px 13px 14px",
                  background: "#fff",
                  boxShadow: "inset 0 0 0 1.5px var(--c-line)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--c-text)",
                  cursor: "pointer",
                }}
              >
                {/* Grouped by the language of the text, the interface's
                    language first, so an English verse is never picked by
                    accident from a list of Spanish ones. */}
                {(locale === "es" ? (["es", "en"] as const) : (["en", "es"] as const)).map((lang) => {
                  const inLang = versions.filter((v) => textLocaleForVersion(v) === lang);
                  if (inLang.length === 0) return null;
                  return (
                    <optgroup key={lang} label={msg.versionGroup[lang]}>
                      {inLang.map((v) => (
                        <option key={v} value={v}>
                          {v} · {VERSION_NAMES[v as VersionId] ?? v}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%) rotate(90deg)",
                  color: `var(--card-${color}-solid)`,
                  pointerEvents: "none",
                  display: "inline-flex",
                }}
              >
                <Chevron size={16} strokeWidth={2.6} />
              </span>
            </div>
          )}
        </div>

        {/* Live text preview (shown once the citation is valid). */}
        {parsed && preview.state !== "idle" && (
          <section
            aria-live="polite"
            className="vr-fade-up"
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: "var(--r-xl)",
              padding: "16px 18px 14px 22px",
              boxShadow: "var(--shadow-sm)",
              overflow: "hidden",
            }}
          >
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 5,
                background: `var(--card-${color}-bg)`,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  color: `var(--card-${color}-solid)`,
                }}
              >
                {msg.previewTitle}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-muted)" }}>
                {parsed.display[locale]} · {version}
              </span>
            </div>
            {preview.state === "loading" ? (
              <div aria-label={msg.previewLoading} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[100, 92, 64].map((w) => (
                  <div key={w} className="vr-skeleton" style={{ height: 13, width: `${w}%`, borderRadius: 6 }} />
                ))}
              </div>
            ) : preview.state === "error" ? (
              <p style={{ margin: 0, fontSize: 13, color: "#B91C1C" }}>{msg.previewError}</p>
            ) : (
              <>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-serif)",
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "var(--c-text)",
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {preview.text}
                </p>
                {preview.copyright && (
                  <p style={{ margin: "10px 0 0", fontSize: 9, color: "var(--c-soft)", fontStyle: "italic" }}>
                    {preview.copyright}
                  </p>
                )}
              </>
            )}
          </section>
        )}

        {/* Color */}
        <div>
          <FormLabel
            hint={locale === "es" ? "Cue visual para recordar" : "Visual recall cue"}
          >
            {t.color}
          </FormLabel>
          <ColorPicker value={color} onChange={setColor} locale={locale} label={t.color} />
        </div>

        {/* Icon */}
        <div>
          <FormLabel
            hint={
              locale === "es" ? "Asocia un símbolo al verso" : "Associate a symbol"
            }
          >
            {t.icon}
          </FormLabel>
          <IconPicker
            value={icon}
            color={color}
            label={t.icon}
            onChange={(id) => {
              setIcon(id);
              setIconTouched(true);
            }}
          />
        </div>

        {/* Hint */}
        <div>
          <FormLabel
            htmlFor="vr-hint-input"
            hint={
              locale === "es" ? "Solo aparece si te rindes" : "Only shows if you give up"
            }
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Bulb size={13} /> {t.hint}
            </span>
          </FormLabel>
          <div
            className="vr-field"
            style={{
              background: "#fff",
              borderRadius: "var(--r-lg)",
              padding: "12px 14px",
              boxShadow: "inset 0 0 0 1.5px var(--c-line)",
            }}
          >
            <input
              id="vr-hint-input"
              value={hint}
              onChange={(e) => setHint(e.target.value.slice(0, 120))}
              placeholder={t.hintPlaceholder}
              style={{
                width: "100%",
                border: "none",
                fontSize: 14,
                fontFamily: "var(--font-sans)",
                fontStyle: "italic",
                color: "var(--c-text)",
                background: "transparent",
              }}
            />
          </div>
          <p
            style={{
              fontSize: 11,
              color: "var(--c-muted)",
              margin: "6px 4px 0",
              lineHeight: 1.4,
            }}
          >
            {locale === "es"
              ? "La pista permanece oculta. Si no recuerdas el verso, podrás revelarla con un toque."
              : "The hint stays hidden. If you can't recall the verse, you can reveal it with one tap."}
          </p>
        </div>

        {/* Collections */}
        <div>
          <FormLabel
            hint={
              locale === "es"
                ? "Un verso puede estar en varias"
                : "A verse can be in multiple"
            }
          >
            {t.collections}
          </FormLabel>
          <CollectionPicker
            collections={collections}
            selectedIds={collectionIds}
            onChange={setCollectionIds}
            onCreate={createCollection}
            newLabel={locale === "es" ? "Nueva" : "New"}
            namePlaceholder={msg.collectionName}
          />
        </div>
      </div>

      {/* Sticky save */}
      <div
        className="vr-fixed-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "14px 20px max(30px, calc(20px + env(safe-area-inset-bottom)))",
          background: "linear-gradient(180deg, transparent, var(--c-bg) 35%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          // Above the bottom tab bar so the save button stays fully tappable
          // on the focused New Verse screen.
          zIndex: "var(--z-overlay)",
        }}
      >
        {submitError && (
          <p role="alert" style={{ color: "#B91C1C", fontSize: 13, margin: 0 }}>
            {submitError}
          </p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!canSave}
          className="vr-press"
          style={{
            background: canSave ? "var(--brand-primary)" : "var(--c-soft)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r-full)",
            padding: "16px 24px",
            height: 56,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 17,
            letterSpacing: "-0.1px",
            width: "100%",
            maxWidth: 480,
            boxShadow: canSave
              ? "0 8px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)"
              : "none",
            cursor: canSave ? "pointer" : "not-allowed",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "…" : (submitLabel ?? t.save)}
        </button>
      </div>
    </main>
  );
}

const FORM_MESSAGES = {
  es: {
    intro:
      "Escribe la cita del verso que quieres memorizar, por ejemplo Juan 3:16. Te mostramos el texto para que confirmes que es el correcto; luego elige color, ícono y una pista, y queda listo para practicar.",
    guideLink: "¿Cómo funciona?",
    invalidRef: "Cita no reconocida. Prueba 'Juan 14:6' o 'Romanos 8:28-30'.",
    previewTitle: "Así dice el verso",
    previewLoading: "Cargando el texto…",
    previewError: "No pudimos cargar el texto. Revisa la cita o inténtalo de nuevo.",
    versionUnavailable: "Esa versión ya no está disponible. Elige otra.",
    versionGroup: { es: "Español", en: "Inglés" },
    invalidCollection: "Una de las colecciones ya no existe. Revisa tu selección.",
    notFound: "Este verso ya no existe.",
    network: "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
    generic: "No se pudo guardar. Inténtalo de nuevo.",
    duplicateCollection: "Ya existe esa colección",
    createCollectionFailed: "No se pudo crear la colección",
    collectionName: "Nombre…",
  },
  en: {
    intro:
      "Type the verse you want to memorize, for example John 3:16. We show you its text so you can confirm it is the right one; then pick a color, icon and hint, and it is ready to practice.",
    guideLink: "How does it work?",
    invalidRef: "Verse not recognized. Try 'John 14:6' or 'Romans 8:28-30'.",
    previewTitle: "The verse reads",
    previewLoading: "Loading the text…",
    previewError: "We couldn't load the text. Check the citation or try again.",
    versionUnavailable: "That version is no longer available. Pick another one.",
    versionGroup: { es: "Spanish", en: "English" },
    invalidCollection: "One of the collections no longer exists. Check your selection.",
    notFound: "This verse no longer exists.",
    network: "You're offline. Check your connection and try again.",
    generic: "Couldn't save. Please try again.",
    duplicateCollection: "That collection already exists",
    createCollectionFailed: "Couldn't create the collection",
    collectionName: "Name…",
  },
} as const;

function FormLabel({
  children,
  hint,
  htmlFor,
}: {
  children: React.ReactNode;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "var(--c-text)",
          letterSpacing: "0.6px",
          textTransform: "uppercase",
        }}
      >
        {children}
      </label>
      {hint && (
        <span
          style={{
            fontSize: 10,
            color: "var(--c-muted)",
            fontStyle: "italic",
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
