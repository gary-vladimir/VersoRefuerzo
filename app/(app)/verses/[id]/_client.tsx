"use client";

// Card View client — owns flip state, hint visibility, and lazy text fetch.
// The grading row that lives below the card in M4 is intentionally rendered
// as a placeholder here so the layout doesn't shift when M4 wires SM-2.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isCardColor, isVerseIcon, COLLECTION_COLORS } from "@/lib/catalog";
import { formatDisplay } from "@/lib/bible/reference";
import { VerseIcon } from "@/components/icons/VerseIcons";
import { useToast } from "@/components/ui/Toast";
import type { Verse } from "@/db/schema";

type Strings = {
  back: string;
  edit: string;
  delete: string;
  deleted: string;
  undo: string;
  revealVerse: string;
  showHint: string;
  hint: string;
  practiceNow: string;
  skip: string;
  masteryPercent: (pct: number) => string;
  copyrightFallback: string;
  recite: string;
  loading: string;
};

type CollectionLink = { id: string; name: string; colorKey: string };

type Props = {
  verse: Verse;
  initialText: string | null;
  copyrightAttribution: string | null;
  collections: CollectionLink[];
  locale: "es" | "en";
  strings: Strings;
};

export function CardViewClient({
  verse,
  initialText,
  copyrightAttribution,
  collections,
  locale,
  strings: t,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [revealed, setRevealed] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [text, setText] = useState<string | null>(initialText);
  const [textLoading, setTextLoading] = useState(false);

  const color = isCardColor(verse.color) ? verse.color : "indigo";
  const icon = isVerseIcon(verse.icon) ? verse.icon : "bible";
  const refDisplay = formatDisplay(verse.canonicalRef, locale);
  const masteryPct = Math.round((verse.mastery ?? 0) * 100);

  async function ensureText() {
    if (text || textLoading) return;
    setTextLoading(true);
    try {
      const res = await fetch(
        `/api/bible/text?ref=${encodeURIComponent(verse.canonicalRef)}&version=${encodeURIComponent(verse.version)}`,
      );
      if (res.ok) {
        const j = (await res.json()) as { text: string };
        setText(j.text);
      }
    } finally {
      setTextLoading(false);
    }
  }

  async function reveal() {
    setRevealed(true);
    void ensureText();
  }

  async function handleDelete() {
    const res = await fetch(`/api/verses/${verse.id}`, { method: "DELETE" });
    if (!res.ok) return;
    router.push("/library");
    toast.show({
      message: t.deleted,
      actionLabel: t.undo,
      onAction: async () => {
        const r = await fetch(`/api/verses/${verse.id}/restore`, { method: "POST" });
        if (r.ok) router.push(`/verses/${verse.id}`);
      },
    });
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: `linear-gradient(180deg, var(--card-${color}-tint) 0%, var(--c-bg) 60%)`,
        paddingBottom: 40,
        position: "relative",
      }}
    >
      <header
        style={{
          padding: "32px 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/library"
          aria-label={t.back}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-xs)",
            color: "var(--c-text)",
            textDecoration: "none",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          ←
        </Link>
        <div style={{ display: "flex", gap: 6 }}>
          <Link
            href={`/verses/${verse.id}/edit`}
            aria-label={t.edit}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-xs)",
              color: "var(--c-text)",
              textDecoration: "none",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            ✎
          </Link>
          <button
            type="button"
            aria-label={t.delete}
            onClick={handleDelete}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "#fff",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-xs)",
              color: "#B91C1C",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            🗑
          </button>
        </div>
      </header>

      <div style={{ padding: "12px 20px 0", display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => (revealed ? setRevealed(false) : reveal())}
          aria-label={revealed ? "front" : "back"}
          className="vr-flip-host"
          style={{
            width: 320,
            height: 380,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <div className={`vr-flip-card ${revealed ? "flipped" : ""}`}>
            <FrontFace color={color} icon={icon} refDisplay={refDisplay} version={verse.version} />
            <BackFace
              color={color}
              icon={icon}
              refDisplay={refDisplay}
              version={verse.version}
              text={text}
              textLoading={textLoading}
              hint={verse.hint}
              hintShown={hintShown}
              hintLabel={t.hint}
              loadingLabel={t.loading}
              copyright={copyrightAttribution ?? t.copyrightFallback}
            />
          </div>
        </button>
      </div>

      <div style={{ padding: "24px 20px 0", maxWidth: 480, margin: "0 auto" }}>
        {!revealed ? (
          <>
            <p
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "var(--c-muted)",
                margin: "0 0 14px",
                fontWeight: 500,
              }}
            >
              {t.recite}
            </p>
            <button
              type="button"
              onClick={reveal}
              style={primaryButtonStyle}
            >
              👁 {t.revealVerse}
            </button>
          </>
        ) : (
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "var(--c-muted)",
              margin: "0 0 14px",
              fontWeight: 500,
            }}
          >
            {locale === "es" ? "¿Cómo te fue?" : "How did it go?"}
          </p>
        )}

        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {verse.hint && (
            <button
              type="button"
              onClick={() => {
                setHintShown((s) => !s);
                if (!revealed) reveal();
              }}
              aria-pressed={hintShown}
              style={{
                background: hintShown ? `var(--card-${color}-tint)` : "#fff",
                border: "none",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--c-text)",
                boxShadow: "var(--shadow-xs)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              💡 {t.showHint}
            </button>
          )}
          {/* `Repasar ahora` opens a one-card Classic session — wired in M4. */}
        </div>

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--c-soft)",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {t.skip}
          </button>
        </div>
      </div>

      <div
        style={{
          padding: "20px 20px 0",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {collections.map((c) => {
          const preset =
            COLLECTION_COLORS.find((p) => p.id === c.colorKey) ?? COLLECTION_COLORS[0]!;
          return (
            <Link
              key={c.id}
              href={`/library/collections/${c.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 999,
                background: preset.bg,
                color: preset.fg,
                fontSize: 11,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: preset.dot,
                  display: "inline-block",
                }}
              />
              {c.name}
            </Link>
          );
        })}
        <span
          style={{
            background: "#fff",
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 11,
            color: "var(--c-indigo-700)",
            fontWeight: 700,
            boxShadow: "var(--shadow-xs)",
          }}
        >
          {t.masteryPercent(masteryPct)}
        </span>
      </div>
    </main>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  height: 56,
  border: "none",
  borderRadius: "var(--r-full)",
  background: "var(--brand-primary)",
  color: "#fff",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 17,
  letterSpacing: "-0.1px",
  boxShadow: "0 8px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
  cursor: "pointer",
};

function FrontFace({
  color,
  icon,
  refDisplay,
  version,
}: {
  color: string;
  icon: string;
  refDisplay: string;
  version: string;
}) {
  return (
    <div
      className="vr-flip-face"
      style={{
        borderRadius: "var(--r-3xl)",
        background: `var(--card-${color}-bg)`,
        boxShadow: "var(--shadow-xl)",
        padding: 28,
        color: "#fff",
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <span
        className="vr-float"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <VerseIcon
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id={icon as any}
          size={130}
          color="#fff"
          strokeWidth={1.6}
        />
      </span>
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-0.7px",
          }}
        >
          {refDisplay}
        </div>
        <div
          style={{
            fontSize: 11,
            opacity: 0.85,
            marginTop: 4,
            letterSpacing: 1,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {version}
        </div>
      </div>
    </div>
  );
}

function BackFace({
  color,
  icon,
  refDisplay,
  version,
  text,
  textLoading,
  hint,
  hintShown,
  hintLabel,
  loadingLabel,
  copyright,
}: {
  color: string;
  icon: string;
  refDisplay: string;
  version: string;
  text: string | null;
  textLoading: boolean;
  hint: string | null;
  hintShown: boolean;
  hintLabel: string;
  loadingLabel: string;
  copyright: string;
}) {
  return (
    <div
      className="vr-flip-face vr-flip-back"
      style={{
        borderRadius: "var(--r-3xl)",
        background: "#fff",
        boxShadow: "var(--shadow-xl)",
        padding: 24,
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `var(--card-${color}-bg)`,
          opacity: 0.08,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `var(--card-${color}-bg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <VerseIcon
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id={icon as any}
            size={20}
            color="#fff"
            strokeWidth={2.3}
          />
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 16,
              color: "var(--c-text)",
            }}
          >
            {refDisplay}
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--c-muted)",
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
            }}
          >
            {version}
          </div>
        </div>
      </div>

      <p
        style={{
          flex: 1,
          fontFamily: "var(--font-serif)",
          fontSize: 17,
          lineHeight: 1.5,
          color: "var(--c-text)",
          margin: 0,
        }}
      >
        {text ?? (textLoading ? loadingLabel : "—")}
      </p>

      {hintShown && hint && (
        <div
          className="vr-hint-appear"
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            background: `var(--card-${color}-tint)`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>💡</span>
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: `var(--card-${color}-solid)`,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
              }}
            >
              {hintLabel}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--c-text)",
                fontStyle: "italic",
                marginTop: 1,
              }}
            >
              {hint}
            </div>
          </div>
        </div>
      )}

      <p
        style={{
          margin: "12px 0 0",
          fontSize: 9,
          color: "var(--c-soft)",
          fontStyle: "italic",
        }}
      >
        {copyright}
      </p>
    </div>
  );
}
