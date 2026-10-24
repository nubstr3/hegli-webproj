"use client";

import { useEffect, type ReactNode } from "react";
import { BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_MUTED } from "@/app/components/theme";

/**
 * A panel that slides up from the bottom of the screen, the touch version of the
 * desktop's centred dialogs. Tap the dimmed area, the close button or press Escape to dismiss.
 */
export default function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // stop the page scrolling behind the sheet
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(5,5,7,0.72)" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
          background: BG_PANEL,
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          borderRadius: "14px 14px 0 0",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
          fontFamily: FONT_MONO,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            minHeight: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "0 8px 0 16px",
            borderBottom: `1px solid ${BORDER_SUBTLE}`,
            background: "rgba(255,255,255,0.015)",
            fontSize: 12,
            color: TEXT_MUTED,
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          <button
            type="button"
            onClick={onClose}
            style={{ minWidth: 72, height: 44, background: "none", border: "none", color: TEXT_MUTED, fontFamily: FONT_MONO, fontSize: 12 }}
          >
            &times; close
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "8px 8px calc(12px + env(safe-area-inset-bottom))" }}>{children}</div>
      </div>
    </div>
  );
}