"use client";

// Collection delete-with-undo (specs.md §17.5), rendered in the collection
// detail header. Mirrors the verse delete flow: soft-delete on the server,
// navigate away, and show an undo toast that restores within the window.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "@/components/icons/UiIcons";
import { useToast } from "@/components/ui/Toast";

type Strings = { delete: string; deleted: string; undo: string };

export function CollectionActions({ id, strings: t }: { id: string; strings: Strings }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

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
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      aria-label={t.delete}
      className="vr-press"
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: "#fff",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--shadow-xs)",
        color: "#B91C1C",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <Trash size={17} />
    </button>
  );
}
