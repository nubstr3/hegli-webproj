"use client";

import { useState } from "react";
import type { UpdateEntry } from "./aboutShared";
import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_DIM, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from "@/app/components/theme";

const SHOW = 3;

/** The updates.log box under the About notepad: newest 3, with a toggle for the rest. */
export default function UpdatesLog({ updates }: { updates: UpdateEntry[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? updates : updates.slice(0, SHOW);
  const hidden = updates.length - SHOW;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        boxSizing: "border-box",
        background: BG_PANEL,
        border: `1px solid ${BORDER_SUBTLE}`,
        borderRadius: 6,
        overflow: "hidden",
        fontFamily: FONT_MONO,
        boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 16px",
          borderBottom: `1px solid ${BORDER_SUBTLE}`,
          background: "rgba(255,255,255,0.015)",
          fontSize: 12,
          color: TEXT_MUTED,
        }}
      >
        <span>updates.log</span>
        <span style={{ color: TEXT_FAINT }}>newest first</span>
      </div>

      <div style={{ padding: "6px 24px 18px", fontSize: 13 }}>
        {updates.length === 0 && (
          <div style={{ padding: "16px 0", color: TEXT_DIM }}>{"# nothing posted yet."}</div>
        )}

        {shown.map((u, i) => (
          <div
            key={u.id}
            style={{
              padding: "16px 0",
              borderBottom: i === shown.length - 1 && hidden <= 0 ? "none" : `1px solid rgba(255,255,255,0.05)`,
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ color: ACCENT, fontSize: 12 }}>{u.posted_on}</span>
              <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{u.title}</span>
            </div>
            {u.body && (
              <div
                style={{
                  color: "#9A9AA0",
                  lineHeight: 1.8,
                  marginTop: 6,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {u.body}
              </div>
            )}
          </div>
        ))}

        {hidden > 0 && (
          <div style={{ paddingTop: 14 }}>
            <button type="button" className="hegli-act" onClick={() => setAll((v) => !v)} style={actStyle}>
              {all ? "show fewer" : `show older (${hidden})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const actStyle = {
  background: "none",
  border: "none",
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: "pointer",
} as const;