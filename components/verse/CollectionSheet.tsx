"use client";

// Collection create / edit sheet (specs.md §17.5, §17.6). One form for both:
// "Nueva colección" in the Library POSTs a new collection, the pencil on a
// collection page PATCHes it. Name (unique per user), optional description,
// and one of the eight tag colors.

import { useEffect, useRef, useState } from "react";
import { COLLECTION_COLORS, type CollectionColorId } from "@/lib/catalog";
import type { Collection } from "@/db/schema";

export type CollectionSheetStrings = {
  title: string;
  name: string;
  description: string;
  color: string;
  save: string;
  cancel: string;
  duplicateName: string;
  saveFailed: string;
};

type Props = {
  // Absent: create a new collection. Present: edit that collection.
  id?: string;
  initial: { name: string; description: string; colorKey: string };
  strings: CollectionSheetStrings;
  onClose: () => void;
  onSaved: (collection: Collection) => void;
};

export function CollectionSheet({ id, initial, strings: t, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [colorKey, setColorKey] = useState(initial.colorKey);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSave = name.trim().length > 0 && !saving;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(id ? `/api/collections/${id}` : "/api/collections", {
        method: id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          colorKey: colorKey as CollectionColorId,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error === "duplicate_name" ? t.duplicateName : t.saveFailed);
        setSaving(false);
        return;
      }
      const { collection } = (await res.json()) as { collection: Collection };
      onSaved(collection);
    } catch {
      setError(t.saveFailed);
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      onClick={onClose}
      className="vr-fade-in vr-sheet-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--scrim)",
        zIndex: "var(--z-modal)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="vr-card-rise vr-sheet-panel"
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 480,
          borderRadius: "var(--r-3xl) var(--r-3xl) 0 0",
          padding: "22px 20px calc(24px + env(safe-area-inset-bottom))",
          boxShadow: "var(--shadow-xl)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 17,
            color: "var(--c-text)",
          }}
        >
          {t.title}
        </h2>
        <label style={labelStyle}>
          {t.name}
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          {t.description}
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={120}
            style={inputStyle}
          />
        </label>
        <div role="radiogroup" aria-label={t.color} style={{ display: "flex", gap: 8 }}>
          {COLLECTION_COLORS.map((c) => {
            const sel = c.id === colorKey;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={sel}
                aria-label={c.id}
                onClick={() => setColorKey(c.id)}
                className="vr-press"
                style={{
                  flex: 1,
                  aspectRatio: "1 / 1",
                  maxWidth: 40,
                  borderRadius: "50%",
                  border: "none",
                  background: c.dot,
                  cursor: "pointer",
                  boxShadow: sel ? `0 0 0 3px #fff, 0 0 0 5px ${c.dot}` : "none",
                }}
              />
            );
          })}
        </div>
        {error && (
          <p role="alert" style={{ margin: 0, color: "#B91C1C", fontSize: 13 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onClose} className="vr-press" style={secondaryStyle}>
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="vr-press"
            style={{ ...primaryStyle, opacity: canSave ? 1 : 0.6 }}
          >
            {saving ? "…" : t.save}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 11,
  fontWeight: 800,
  color: "var(--c-text)",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "var(--r-lg)",
  padding: "12px 14px",
  boxShadow: "inset 0 0 0 1.5px var(--c-line)",
  fontFamily: "var(--font-sans)",
  // 16px keeps iOS Safari from zooming the field on focus.
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: 0,
  textTransform: "none",
  color: "var(--c-text)",
  background: "#fff",
};

const primaryStyle: React.CSSProperties = {
  flex: 1,
  height: 48,
  border: "none",
  borderRadius: "var(--r-full)",
  background: "var(--brand-primary)",
  color: "#fff",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};

const secondaryStyle: React.CSSProperties = {
  flex: 1,
  height: 48,
  border: "none",
  borderRadius: "var(--r-full)",
  background: "var(--c-card-soft)",
  color: "var(--c-text)",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};
