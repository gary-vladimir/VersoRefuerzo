"use client";

// Bottom-anchored snackbar with an Undo affordance (specs.md §17.5).
// Provider-driven so any descendant can call `useToast().show(...)`.
//
// Behavior:
//   - The toast slides in, then auto-dismisses at the end of `durationMs`
//     (default 5000ms) with a slide-out.
//   - A countdown bar fills the underside as time elapses.
//   - Tapping the action button runs `onAction` synchronously, then animates
//     the toast out.
//
// Important: a "delete" toast assumes the row is already soft-deleted on the
// server when shown. The action callback issues the *restore* call. If the
// user lets the timer expire we do nothing — the server-side housekeeping
// sweep will commit the hard-delete on the next list read.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Close } from "@/components/icons/UiIcons";

type ToastSpec = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type Live = ToastSpec & { id: number };

type ToastApi = { show: (t: ToastSpec) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const EXIT_MS = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Live | null>(null);
  const seq = useRef(0);

  const show = useCallback((t: ToastSpec) => {
    seq.current += 1;
    // Replacing the visible toast: the `key={id}` on ToastView remounts a
    // fresh instance, whose own timers supersede the previous one.
    setToast({ ...t, id: seq.current });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <ToastView
          key={toast.id}
          message={toast.message}
          actionLabel={toast.actionLabel}
          durationMs={toast.durationMs ?? 5000}
          onAction={toast.onAction}
          // Guard against a stale exit clearing a newer toast.
          onClosed={() =>
            setToast((cur) => (cur && cur.id === toast.id ? null : cur))
          }
        />
      )}
    </ToastContext.Provider>
  );
}

function ToastView({
  message,
  actionLabel,
  onAction,
  onClosed,
  durationMs,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClosed: () => void;
  durationMs: number;
}) {
  const [leaving, setLeaving] = useState(false);
  const autoTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);
  // Hold the latest onClosed in a ref so beginClose stays referentially
  // stable — otherwise an unrelated parent re-render would reset the
  // auto-dismiss timer below.
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const beginClose = useCallback(() => {
    if (exitTimer.current !== null) return; // already closing
    if (autoTimer.current !== null) window.clearTimeout(autoTimer.current);
    setLeaving(true);
    exitTimer.current = window.setTimeout(() => onClosedRef.current(), EXIT_MS);
  }, []);

  useEffect(() => {
    autoTimer.current = window.setTimeout(beginClose, durationMs);
    return () => {
      if (autoTimer.current !== null) window.clearTimeout(autoTimer.current);
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    };
  }, [durationMs, beginClose]);

  function handleAction() {
    onAction?.();
    beginClose();
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(20px + env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        background: "var(--c-ink)",
        color: "#fff",
        borderRadius: "var(--r-lg)",
        padding: "12px 12px 12px 16px",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        boxShadow: "var(--shadow-xl)",
        minWidth: 260,
        maxWidth: "calc(100vw - 32px)",
        zIndex: "var(--z-toast)",
        overflow: "hidden",
      }}
      className={leaving ? "vr-toast-out" : "vr-toast-in"}
    >
      <span style={{ flex: 1 }}>{message}</span>
      {actionLabel && (
        <button
          type="button"
          onClick={handleAction}
          className="vr-press"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--c-amber-400)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            padding: "8px 10px",
            minHeight: 40,
            letterSpacing: "0.2px",
          }}
        >
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={beginClose}
        aria-label="dismiss"
        className="vr-press"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.55)",
          cursor: "pointer",
          width: 32,
          height: 32,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Close size={16} />
      </button>
      <span
        aria-hidden
        className="vr-toast-bar"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          background: "var(--c-amber-400)",
          transformOrigin: "left",
          animation: `vr-toast-countdown ${durationMs}ms linear forwards`,
        }}
      />
      <style>{`
        @keyframes vr-toast-countdown {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vr-toast-bar { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
