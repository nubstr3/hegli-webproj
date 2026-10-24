"use client";

import { useState, type CSSProperties } from "react";
import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_DIM, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from "@/app/components/theme";

/**
 * Touch version of the contact.txt editor card. Same look and wording as desktop
 * (name = "...", message = """...""") without the line-number gutter, which would
 * eat a third of a phone's width. Like desktop, nothing is actually sent yet.
 */
export default function MobileContactForm() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true); // no backend yet - same placeholder behaviour as the desktop page
  };

  return (
    <div
      style={{
        background: BG_PANEL,
        border: `1px solid ${BORDER_SUBTLE}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        fontFamily: FONT_MONO,
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          borderBottom: `1px solid ${BORDER_SUBTLE}`,
          background: "rgba(255,255,255,0.015)",
          fontSize: 12,
          color: TEXT_PRIMARY,
        }}
      >
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />
        contact.txt
      </div>

      <form onSubmit={onSubmit} style={{ padding: "20px 16px 22px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: TEXT_FAINT }}>
          {"// reach out — I'll get back to you within a day or two"}
        </div>

        <label style={{ ...row, marginTop: 14 }}>
          <span style={key}>
            <span style={{ color: ACCENT }}>name</span> <span style={{ color: TEXT_DIM }}>=</span>
          </span>
          <input name="name" type="text" autoComplete="name" placeholder='"your name"' style={field} />
        </label>

        <label style={row}>
          <span style={key}>
            <span style={{ color: ACCENT }}>email</span> <span style={{ color: TEXT_DIM }}>=</span>
          </span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            placeholder='"you@example.com"'
            style={field}
          />
        </label>

        <label style={{ ...row, alignItems: "stretch" }}>
          <span style={key}>
            <span style={{ color: ACCENT }}>message</span> <span style={{ color: TEXT_DIM }}>= &quot;&quot;&quot;</span>
          </span>
          <textarea
            name="message"
            rows={5}
            placeholder="say hi, or tell me about a project..."
            style={{ ...field, height: "auto", padding: "10px 0 10px 16px", lineHeight: 1.7, resize: "none" }}
          />
          <span style={{ ...key, color: TEXT_DIM }}>&quot;&quot;&quot;</span>
        </label>

        <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.6, color: TEXT_FAINT }}>{"// find me:"}</div>
        <a href="https://github.com/nubstr3" target="_blank" rel="noopener noreferrer" style={linkRow}>
          <span><span style={{ color: TEXT_DIM }}>&rarr;</span> github</span>
          <span style={{ color: TEXT_DIM }}>github.com/nubstr3</span>
        </a>
        <a
          href="https://linkedin.com/in/henry-li-981280224"
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...linkRow, borderBottom: `1px solid ${BORDER_SUBTLE}` }}
        >
          <span><span style={{ color: TEXT_DIM }}>&rarr;</span> linkedin</span>
          <span style={{ color: TEXT_DIM }}>linkedin.com</span>
        </a>

        <button
          type="submit"
          style={{
            marginTop: 18,
            width: "100%",
            height: 52,
            background: "transparent",
            border: `1px solid ${ACCENT}`,
            borderRadius: 6,
            color: ACCENT,
            fontFamily: FONT_MONO,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          [ send ]
        </button>

        {sent && (
          <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6, color: ACCENT }}>
            &#10003; message queued — thanks, I&apos;ll reply soon.
          </div>
        )}
      </form>
    </div>
  );
}

const row: CSSProperties = { display: "flex", flexDirection: "column", gap: 0 };
const key: CSSProperties = { fontSize: 13, lineHeight: 1.9, color: TEXT_MUTED };
const field: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  height: 48,
  padding: "0 0 0 16px",
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${BORDER_SUBTLE}`,
  outline: "none",
  color: TEXT_PRIMARY,
  fontFamily: FONT_MONO,
  fontSize: 16, // 16px+ stops iOS Safari zooming in on focus
};
const linkRow: CSSProperties = {
  minHeight: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  borderTop: `1px solid ${BORDER_SUBTLE}`,
  color: TEXT_PRIMARY,
  fontSize: 12,
  textDecoration: "none",
};