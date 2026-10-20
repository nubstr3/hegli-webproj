import PageShell from "@/app/components/PageShell";
import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_DIM } from "@/app/components/theme";

export default function AboutPage() {
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
        <div
          style={{
            width: "100%",
            maxWidth: 760,
            background: BG_PANEL,
            border: `1px solid ${BORDER_SUBTLE}`,
            borderRadius: 10,
            padding: "36px 40px",
            fontFamily: FONT_MONO,
            fontSize: 15,
            lineHeight: 1.9,
            boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ color: ACCENT }}>
            Henry &mdash; developer, dillydallyer, player 1.
          </div>
          <div style={{ height: 20 }} />
          <div style={{ color: "#C9C9CE" }}>
            Based in Auckland, building hegli.dev as a sandbox for real
          </div>
          <div style={{ color: "#C9C9CE" }}>
            features: admin dashboards, auth, APIs, and the occasional
          </div>
          <div style={{ color: "#C9C9CE" }}>
            bit of UI experimentation along the way.
          </div>
          <div style={{ height: 20 }} />
          <div style={{ color: TEXT_DIM }}>currently playing with:</div>
          <div style={{ color: "#C9C9CE" }}>Next.js, Supabase, Vercel, Tailwind</div>
          <div style={{ height: 28 }} />
          <div
            style={{
              borderTop: `1px solid ${BORDER_SUBTLE}`,
              paddingTop: 14,
              fontSize: 12,
              color: TEXT_DIM,
            }}
          >
            Ln 9, Col 1
          </div>
        </div>
      </div>
    </PageShell>
  );
}
