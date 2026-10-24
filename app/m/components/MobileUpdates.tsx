"use client";

import { useState } from "react";
import type { UpdateEntry } from "@/app/about/aboutShared";
import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_DIM, TEXT_MUTED, TEXT_PRIMARY } from "@/app/components/theme";

const SHOW = 3;

/** Touch version of UpdatesLog: newest 3, with a full-width tap target for the rest. */
export default function MobileUpdates({ updates }: { updates: UpdateEntry[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? updates : updates.slice(0, SHOW);
  const hidden = updates.length - SHOW;

  return (
    <div
      style={{
        background: BG_PANEL,
        border: `1px solid ${BORDER_SUBTLE}`,
        borderRadius: 10,
        overflow: "hidden",
        fontFamily: FONT_MONO,
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: `1px solid ${BORDER_SUBTLE}`,
          fontSize: 12,
          color: "#cfcfd4",
        }}
      >
        <span>updates.log</span>
        <span style={{ fontSize: 11, color: "#8a8a93" }}>newest first</span>
      </div>

      {updates.length === 0 && (
        <div style={{ padding: "18px 16px", fontSize: 12, color: TEXT_DIM }}>{"# nothing posted yet."}</div>
      )}

      {shown.map((u, i) => (
        <div
          key={u.id}
          style={{ margin: "0 16px", padding: "18px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER_SUBTLE}` }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 12, fontSize: 13, lineHeight: 1.6 }}>
            <span style={{ color: ACCENT }}>{u.posted_on}</span>
            <span style={{ color: TEXT_PRIMARY, fontWeight: 700 }}>{u.title}</span>
          </div>
          {u.body && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                lineHeight: 1.8,
                color: "#8795b5",
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
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          style={{
            width: "100%",
            minHeight: 56,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            background: "none",
            border: "none",
            borderTop: `1px solid ${BORDER_SUBTLE}`,
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: TEXT_MUTED,
            textAlign: "left",
          }}
        >
          {all ? "show fewer" : `show older (${hidden})`}
        </button>
      )}
    </div>
  );
}