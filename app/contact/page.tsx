import type { CSSProperties } from "react";
import PageShell from "@/app/components/PageShell";
import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, FONT_SANS, TEXT_MUTED } from "@/app/components/theme";

const inputStyle: CSSProperties = {
  width: "100%",
  background: BG_PANEL,
  border: `1px solid ${BORDER_SUBTLE}`,
  borderRadius: 8,
  padding: "12px 14px",
  fontSize: 15,
  color: "#ECECEA",
  fontFamily: FONT_SANS,
  boxSizing: "border-box",
};

export default function ContactPage() {
  return (
    <PageShell>
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "48px 64px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700 }}>
            Get in touch
          </div>

          <Field label="Name" placeholder="Jane Smith" />
          <Field label="Email" placeholder="jane@example.com" type="email" />

          <div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 6 }}>Message</div>
            <textarea placeholder="Say hello..." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <button
            type="button"
            style={{
              alignSelf: "flex-start",
              background: ACCENT,
              color: "#0D0D10",
              border: "none",
              borderRadius: 8,
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: FONT_SANS,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Send message
          </button>

          <div
            style={{
              display: "flex",
              gap: 28,
              marginTop: 20,
              paddingTop: 20,
              borderTop: `1px solid ${BORDER_SUBTLE}`,
              fontSize: 14,
            }}
          >
            <a
              href="https://github.com/nubstr3"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: TEXT_MUTED, textDecoration: "none" }}
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/henry-li-981280224"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: TEXT_MUTED, textDecoration: "none" }}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 6 }}>{label}</div>
      <input type={type} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}
