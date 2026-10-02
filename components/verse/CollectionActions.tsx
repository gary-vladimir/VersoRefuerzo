"use client";

// Collection header actions (specs.md §17.5 collection menu: Editar,
// Eliminar), rendered in the collection detail header.
//   - Edit opens the shared CollectionSheet to rename, recolor, or
//     describe the collection.
//   - Delete mirrors the verse flow: soft-delete on the server, navigate
//     away, and show an undo toast that restores within the window.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash } from "@/components/icons/UiIcons";
import { useToast } from "@/components/ui/Toast";
import { CollectionSheet, type CollectionSheetStrings } from "./CollectionSheet";

type Strings = {
  edit: string;
  delete: string;
  deleted: string;
  undo: string;
  sheet: CollectionSheetStrings;
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
        <CollectionSheet
          id={id}
          initial={{ name, description: description ?? "", colorKey }}
          strings={t.sheet}
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
