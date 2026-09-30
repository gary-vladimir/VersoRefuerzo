"use client";

// Collection header actions (specs.md §17.5 collection menu: Editar,
// Eliminar), rendered in the collection detail header.
//   - Edit opens a small sheet to rename, recolor, or describe the
//     collection (PATCH /api/collections/[id]).
//   - Delete mirrors the verse flow: soft-delete on the server, navigate
//     away, and show an undo toast that restores within the window.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash } from "@/components/icons/UiIcons";
import { useToast } from "@/components/ui/Toast";
import { COLLECTION_COLORS, type CollectionColorId } from "@/lib/catalog";

type Strings = {
  edit: string;
  delete: string;
  deleted: string;
  undo: string;
  name: string;
  description: string;
  color: string;
  save: string;
  cancel: string;
  duplicateName: string;
  saveFailed: string;
};

type Props = {
  id: string;
  name: string;
  description: string | null;
  colorKey: string;
  strings: Strings;
};

export function CollectionActions({ id, name, description, colorKey, strings: t }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  // Stable so the sheet's focus/Escape effect does not re-run and steal
  // focus back to the name field whenever this component re-renders.
  const closeEditor = useCallback(() => setEditing(false), []);

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setBusy(false);
      return;
    }
    router.push("/library");
    toast.show({
      message: t.deleted,
      actionLabel: t.undo,
      onAction: async () => {
        const r = await fetch(`/api/collections/${id}/restore`, { method: "POST" });
        if (r.ok) router.push(`/library/collections/${id}`);
        else router.refresh();
      },
    });
  }

  return (
    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={t.edit}
        className="vr-press"
        style={{ ...iconButtonStyle, color: "var(--c-text)" }}
      >
        <Pencil size={17} />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        aria-label={t.delete}
        className="vr-press"
        style={{ ...iconButtonStyle, color: "#B91C1C" }}
      >
        <Trash size={17} />
      </button>
      {editing && (
        <EditSheet
          id={id}
          initial={{ name, description: description ?? "", colorKey }}
          strings={t}
          onClose={closeEditor}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EditSheet({
  id,
  initial,
  strings: t,
  onClose,
  onSaved,
}: {
  id: string;
  initial: { name: string; description: string; colorKey: string };
  strings: Strings;
  onClose: () => void;
  onSaved: () => void;
}) {
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
      const res = await fetch(`/api/collections/${id}`, {
        method: "PATCH",
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
      onSaved();
    } catch {
      setError(t.saveFailed);
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.edit}
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

const iconButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  background: "#fff",
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "var(--shadow-xs)",
  cursor: "pointer",
};

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
