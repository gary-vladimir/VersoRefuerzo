"use client";

// Bottom-anchored snackbar with an Undo affordance (specs.md §17.5).
// Provider-driven so any descendant can call `useToast().show(...)`.
//
// Behavior:
//   - The toast auto-dismisses at the end of `durationMs` (default 5000ms).
//   - A countdown bar fills the underside as time elapses.
//   - Tapping the action button dismisses the toast and runs `onAction`.
//
// Important: a "delete" toast assumes the row is already soft-deleted on the
// server when shown. The action callback issues the *restore* call. If the
// user lets the timer expire we do nothing — the server-side housekeeping
// sweep will commit the hard-delete on the next list read.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastSpec = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type Live = ToastSpec & { id: number; createdAt: number };

type ToastApi = { show: (t: ToastSpec) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Live | null>(null);
  const seq = useRef(0);
  const timer = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setToast(null);
  }, []);

  const show = useCallback(
    (t: ToastSpec) => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      seq.current += 1;
      const id = seq.current;
      const duration = t.durationMs ?? 5000;
      setToast({ ...t, id, createdAt: Date.now() });
      timer.current = window.setTimeout(() => {
        setToast((cur) => (cur && cur.id === id ? null : cur));
        timer.current = null;
      }, duration);
    },
    [],
  );

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
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
          onAction={() => {
            const fn = toast.onAction;
            dismiss();
            fn?.();
          }}
          onDismiss={dismiss}
        />
      )}
    </ToastContext.Provider>
  );
}

function ToastView({
  message,
  actionLabel,
  onAction,
  onDismiss,
  durationMs,
}: {
  message: string;
  actionLabel?: string;
  onAction: () => void;
  onDismiss: () => void;
  durationMs: number;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "max(20px, env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        background: "var(--c-ink)",
        color: "#fff",
        borderRadius: "var(--r-lg)",
        padding: "12px 16px",
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        boxShadow: "var(--shadow-xl)",
        minWidth: 260,
        maxWidth: "calc(100vw - 32px)",
        zIndex: 1000,
        overflow: "hidden",
      }}
      className="vr-card-rise"
    >
      <span style={{ flex: 1 }}>{message}</span>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--c-amber-400)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            padding: "4px 6px",
            letterSpacing: "0.2px",
          }}
        >
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="dismiss"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 16,
          padding: 0,
          marginLeft: -4,
        }}
      >
        ×
      </button>
      <span
        aria-hidden
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
      `}</style>
    </div>
  );
}
