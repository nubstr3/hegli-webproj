"use client";

import { useState } from "react";
import PageShell from "@/app/components/PageShell";
import {
  ACCENT,
  BG_PANEL,
  BORDER_SUBTLE,
  FONT_MONO,
  TEXT_DIM,
  TEXT_FAINT,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from "@/app/components/theme";

const LINE_COUNT = 14;

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  // No backend wired up yet — this just previews the themed confirmation
  // state. Replace with a real submit handler once contact is wired up.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <PageShell>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            background: BG_PANEL,
            border: `1px solid ${BORDER_SUBTLE}`,
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
            fontFamily: FONT_MONO,
          }}
        >
          {/* tab bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: `1px solid ${BORDER_SUBTLE}`,
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRight: `1px solid ${BORDER_SUBTLE}`,
                color: TEXT_PRIMARY,
                fontSize: 12,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />
              contact.txt
            </div>
          </div>

          {/* gutter + content */}
          <div style={{ display: "flex" }}>
            <div
              style={{
                padding: "24px 12px",
                textAlign: "right",
                color: TEXT_FAINT,
                fontSize: 12,
                lineHeight: 1.9,
                userSelect: "none",
                borderRight: "1px solid rgba(255,255,255,0.05)",
                minWidth: 28,
              }}
            >
              {Array.from({ length: LINE_COUNT }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ flex: 1, padding: "24px 22px", display: "flex", flexDirection: "column", gap: 12, lineHeight: 1.9 }}
            >
              <div style={{ color: TEXT_FAINT, fontSize: 12 }}>
                {"// reach out — I'll get back to you within a day or two"}
              </div>
              <div style={{ height: 4 }} />

              <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 13 }}>
                <span style={{ color: ACCENT }}>name</span>
                <span style={{ color: TEXT_DIM }}>=</span>
                <input name="name" type="text" placeholder='"your name"' style={inputStyle} />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 13 }}>
                <span style={{ color: ACCENT }}>email</span>
                <span style={{ color: TEXT_DIM }}>=</span>
                <input name="email" type="email" placeholder='"you@example.com"' style={inputStyle} />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 13 }}>
                <span style={{ color: ACCENT }}>message</span>
                <span style={{ color: TEXT_DIM }}>= &quot;&quot;&quot;</span>
              </div>
              <textarea
                name="message"
                rows={4}
                placeholder="say hi, or tell me about a project..."
                style={{ ...inputStyle, resize: "none", paddingLeft: 20 }}
              />
              <div style={{ color: TEXT_DIM, fontSize: 13 }}>&quot;&quot;&quot;</div>

              <div style={{ height: 4 }} />
              <div style={{ color: TEXT_FAINT, fontSize: 12 }}>
                {"// find me:"}{" "}
                <a href="https://github.com/nubstr3" target="_blank" rel="noopener noreferrer" style={{ color: TEXT_MUTED }}>
                  github.com/nubstr3
                </a>{" "}
                &middot;{" "}
                <a
                  href="https://linkedin.com/in/henry-li-981280224"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: TEXT_MUTED }}
                >
                  linkedin
                </a>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 10,
                  alignSelf: "flex-start",
                  background: "transparent",
                  border: `1px solid ${ACCENT}`,
                  color: ACCENT,
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  padding: "9px 18px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                [ send ]
              </button>

              {sent && (
                <div style={{ color: ACCENT, fontSize: 12 }}>
                  &#10003; message queued — thanks, I&apos;ll reply soon.
                </div>
              )}
            </form>
          </div>

          {/* editor status line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 16px",
              borderTop: `1px solid ${BORDER_SUBTLE}`,
              background: "rgba(255,255,255,0.015)",
              color: TEXT_FAINT,
              fontSize: 11,
            }}
          >
            <span>contact.txt &middot; UTF-8 &middot; LF</span>
            <span>Ln 11, Col 1</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

const inputStyle = {
  background: "transparent",
  border: "none",
  outline: "none",
  color: TEXT_PRIMARY,
  fontFamily: FONT_MONO,
  fontSize: 13,
  width: "100%",
} as const;