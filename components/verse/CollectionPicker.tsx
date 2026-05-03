"use client";

import { useState } from "react";
import {
  COLLECTION_COLORS,
  type CollectionColorId,
} from "@/lib/catalog";
import { Check, Plus } from "@/components/icons/UiIcons";
import type { Collection } from "@/db/schema";

export type CollectionPickerProps = {
  collections: Collection[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreate: (name: string, colorKey: CollectionColorId) => Promise<Collection>;
  newLabel: string;
};

// Renders the user's existing collections as toggleable chips, plus a
// "New" affordance that prompts inline for a name and adds the result
// to the selection.
export function CollectionPicker({
  collections,
  selectedIds,
  onChange,
  onCreate,
  newLabel,
}: CollectionPickerProps) {
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  async function submitNew() {
    if (!draftName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // Pick a deterministic color preset based on existing count to vary visuals.
      const preset = COLLECTION_COLORS[collections.length % COLLECTION_COLORS.length]!;
      const created = await onCreate(draftName.trim(), preset.id);
      onChange([...selectedIds, created.id]);
      setDraftName("");
      setCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {collections.map((c) => {
        const sel = selectedIds.includes(c.id);
        const preset =
          COLLECTION_COLORS.find((p) => p.id === c.colorKey) ?? COLLECTION_COLORS[0]!;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            aria-pressed={sel}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
              border: "none",
              background: sel ? preset.bg : "#fff",
              color: sel ? preset.fg : "var(--c-muted)",
              fontSize: 12,
              fontWeight: 700,
              boxShadow: sel ? "none" : "inset 0 0 0 1.5px var(--c-line)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all .2s",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: sel ? preset.dot : "transparent",
                boxShadow: sel ? "none" : "inset 0 0 0 1.5px var(--c-soft)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {sel && <Check size={9} color="#fff" strokeWidth={4} />}
            </span>
            {c.name}
          </button>
        );
      })}

      {creating ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--c-indigo-50)",
            color: "var(--c-indigo-700)",
          }}
        >
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitNew();
              } else if (e.key === "Escape") {
                setCreating(false);
                setDraftName("");
              }
            }}
            placeholder="Nombre…"
            maxLength={40}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--c-indigo-700)",
              width: 120,
            }}
          />
          <button
            type="button"
            disabled={submitting || !draftName.trim()}
            onClick={submitNew}
            style={{
              border: "none",
              background: "var(--c-indigo-700)",
              color: "#fff",
              borderRadius: 999,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 700,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting || !draftName.trim() ? 0.5 : 1,
            }}
          >
            OK
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--c-indigo-50)",
            color: "var(--c-indigo-700)",
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Plus size={12} strokeWidth={3} /> {newLabel}
        </button>
      )}

      {error && (
        <p style={{ width: "100%", color: "#B91C1C", fontSize: 12, margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
