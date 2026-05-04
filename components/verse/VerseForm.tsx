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
} from "@/lib/catalog";
import { defaultColorForIndex, defaultIconForBook } from "@/lib/bible/defaults";
import { VerseCard } from "@/components/ui/VerseCard";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { CollectionPicker } from "./CollectionPicker";
import { Check, AlertCircle } from "@/components/icons/UiIcons";
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
  const [refInput, setRefInput] = useState(initialReference);
  const [version, setVersion] = useState<string>(
    initialVersion && versions.includes(initialVersion)
      ? initialVersion
      : versions[0] ?? "",
  );
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
      throw new Error(j.error === "duplicate_name" ? "Ya existe esa colección" : "No se pudo crear");
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
        throw new Error(j.error || `${res.status}`);
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
      setSubmitError(e instanceof Error ? e.message : "error");
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        background: "var(--c-bg)",
        minHeight: "100dvh",
        paddingBottom: 120,
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
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t.cancel}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: "var(--c-bg)",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--c-text)",
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          ×
        </button>
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
        <span style={{ width: 36 }} aria-hidden />
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
        <div className="vr-card-rise" key={`${color}-${icon}`}>
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
        {/* Reference */}
        <div>
          <FormLabel>{t.reference}</FormLabel>
          <div
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
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder={locale === "es" ? "Juan 14:6" : "John 14:6"}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
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
              {locale === "es"
                ? "Referencia no reconocida. Prueba 'Juan 14:6' o 'Romanos 8:28-30'."
                : "Reference not recognized. Try 'John 14:6' or 'Romans 8:28-30'."}
            </p>
          )}
        </div>

        {/* Version */}
        <div>
          <FormLabel>{t.version}</FormLabel>
          {versions.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
              {locale === "es"
                ? "No hay versiones disponibles. Configura APIBIBLE_ID_*."
                : "No versions available. Configure APIBIBLE_ID_*."}
            </p>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              {versions.map((v) => {
                const sel = v === version;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVersion(v)}
                    aria-pressed={sel}
                    style={{
                      flex: 1,
                      padding: "11px 0",
                      border: "none",
                      borderRadius: "var(--r-md)",
                      background: sel ? `var(--card-${color}-solid)` : "#fff",
                      color: sel ? "#fff" : "var(--c-text)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 12,
                      boxShadow: sel
                        ? `0 4px 10px var(--card-${color}-solid)40`
                        : "inset 0 0 0 1.5px var(--c-line)",
                      transition: "all .25s",
                      cursor: "pointer",
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Color */}
        <div>
          <FormLabel
            hint={locale === "es" ? "Cue visual para recordar" : "Visual recall cue"}
          >
            {t.color}
          </FormLabel>
          <ColorPicker value={color} onChange={setColor} />
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
            onChange={(id) => {
              setIcon(id);
              setIconTouched(true);
            }}
          />
        </div>

        {/* Hint */}
        <div>
          <FormLabel
            hint={
              locale === "es" ? "Solo aparece si te rindes" : "Only shows if you give up"
            }
          >
            💡 {t.hint}
          </FormLabel>
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--r-lg)",
              padding: "12px 14px",
              boxShadow: "inset 0 0 0 1.5px var(--c-line)",
            }}
          >
            <input
              value={hint}
              onChange={(e) => setHint(e.target.value.slice(0, 120))}
              placeholder={t.hintPlaceholder}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
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
          />
        </div>
      </div>

      {/* Sticky save */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "14px 20px 30px",
          background: "linear-gradient(180deg, transparent, var(--c-bg) 35%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {submitError && (
          <p style={{ color: "#B91C1C", fontSize: 13, margin: 0 }}>{submitError}</p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!canSave}
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

function FormLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
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
