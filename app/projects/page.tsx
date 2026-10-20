import type { CSSProperties } from "react";
import PageShell from "@/app/components/PageShell";
import {
  ACCENT,
  ACCENT_BETA,
  BG_PANEL,
  BORDER_SUBTLE,
  FONT_MONO,
  PROMPT_USER,
  TEXT_DIM,
  TEXT_FAINT,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from "@/app/components/theme";
import {
  BETA_PROJECTS,
  BUILDING_PROJECTS,
  LIVE_PROJECTS,
  PUBLICATIONS,
  QUEUED_PROJECTS,
  type ProjectEntry,
} from "./projectsData";

type Tier = {
  heading: string;
  badge: string;
  color: string;
  border: string;
  badgeBorder: string;
  background: string;
  titleColor: string;
  textOpacity: number;
  noLinkFallback: string;
  items: ProjectEntry[];
};

const TIERS: Tier[] = [
  {
    heading: "# live",
    badge: "LIVE",
    color: ACCENT,
    border: `1px solid ${ACCENT}`,
    badgeBorder: `1px solid ${ACCENT}`,
    background: BG_PANEL,
    titleColor: ACCENT,
    textOpacity: 0.85,
    noLinkFallback: "no public link",
    items: LIVE_PROJECTS,
  },
  {
    heading: "# beta",
    badge: "BETA",
    color: ACCENT_BETA,
    border: `1px solid ${ACCENT_BETA}`,
    badgeBorder: `1px solid ${ACCENT_BETA}`,
    background: BG_PANEL,
    titleColor: TEXT_PRIMARY,
    textOpacity: 0.85,
    noLinkFallback: "in TestFlight — not public yet",
    items: BETA_PROJECTS,
  },
  {
    heading: "# in development",
    badge: "BUILDING",
    color: TEXT_MUTED,
    border: "1px dashed rgba(255,255,255,0.18)",
    badgeBorder: `1px dashed ${TEXT_MUTED}`,
    background: "rgba(255,255,255,0.015)",
    titleColor: TEXT_PRIMARY,
    textOpacity: 0.7,
    noLinkFallback: "building — no link yet",
    items: BUILDING_PROJECTS,
  },
  {
    heading: "# queued",
    badge: "QUEUED",
    color: TEXT_FAINT,
    border: "1px dotted rgba(255,255,255,0.12)",
    badgeBorder: `1px dotted ${TEXT_FAINT}`,
    background: "transparent",
    titleColor: TEXT_MUTED,
    textOpacity: 0.55,
    noLinkFallback: "not started — idea stage",
    items: QUEUED_PROJECTS,
  },
];

const linkStyle: CSSProperties = {
  color: TEXT_MUTED,
  fontSize: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  textDecoration: "none",
};

export default function ProjectsPage() {
  return (
    <PageShell>
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 920,
          margin: "0 auto",
          padding: "48px 24px 80px",
          boxSizing: "border-box",
          fontFamily: FONT_MONO,
        }}
      >
        <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 36 }}>
          <span style={{ color: ACCENT }}>{PROMPT_USER}</span>
          <span style={{ color: TEXT_DIM }}>:~/projects$</span> ls -la
        </div>

        {TIERS.map((tier) => (
          <div key={tier.heading} style={{ marginBottom: 44 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
              <span style={{ color: TEXT_FAINT, fontSize: 13 }}>{tier.heading}</span>
              <span style={{ flex: 1, height: 1, background: BORDER_SUBTLE }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {tier.items.map((p, i) => (
                <div
                  key={`${tier.heading}-${i}`}
                  style={{
                    border: tier.border,
                    borderRadius: 6,
                    padding: "22px 24px",
                    background: tier.background,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <span style={{ color: tier.titleColor, fontSize: 15, fontWeight: 600 }}>{p.name}/</span>
                    <span
                      style={{
                        border: tier.badgeBorder,
                        color: tier.color,
                        fontSize: 11,
                        padding: "3px 9px",
                        borderRadius: 3,
                        flexShrink: 0,
                      }}
                    >
                      {tier.badge}
                    </span>
                  </div>

                  <div style={{ color: TEXT_FAINT, fontSize: 11, marginTop: 6 }}>
                    {p.updatedLabel} {p.updated}
                  </div>

                  <p style={{ color: TEXT_PRIMARY, fontSize: 13, lineHeight: 1.6, margin: "10px 0 14px", opacity: tier.textOpacity }}>
                    {p.description}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {p.stack.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 11,
                          color: TEXT_MUTED,
                          border: `1px solid ${BORDER_SUBTLE}`,
                          borderRadius: 3,
                          padding: "3px 8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 20, borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 14 }}>
                    {p.liveUrl && (
                      <a href={p.liveUrl} style={linkStyle}>
                        &rarr; visit site
                      </a>
                    )}
                    {p.githubUrl && (
                      <a href={p.githubUrl} style={linkStyle}>
                        &rarr; view on github
                      </a>
                    )}
                    {!p.liveUrl && !p.githubUrl && (
                      <span style={{ color: TEXT_FAINT, fontSize: 12 }}>{tier.noLinkFallback}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
            <span style={{ color: TEXT_FAINT, fontSize: 13 }}># publications</span>
            <span style={{ flex: 1, height: 1, background: BORDER_SUBTLE }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PUBLICATIONS.map((pub, i) => (
              <div
                key={`pub-${i}`}
                style={{
                  border: `1px solid ${BORDER_SUBTLE}`,
                  borderRadius: 6,
                  padding: "22px 24px",
                  background: BG_PANEL,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <span style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: 600 }}>{pub.title}</span>
                  <span
                    style={{
                      border: `1px solid ${BORDER_SUBTLE}`,
                      color: TEXT_MUTED,
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 3,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pub.venue}
                  </span>
                </div>
                <div style={{ color: TEXT_FAINT, fontSize: 12, marginTop: 8 }}>{pub.authors}</div>
                <p style={{ color: TEXT_PRIMARY, fontSize: 13, lineHeight: 1.6, margin: "10px 0 14px", opacity: 0.8 }}>
                  {pub.summary}
                </p>
                <div style={{ display: "flex", gap: 20, borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 14 }}>
                  <a href={pub.url} style={linkStyle}>
                    &rarr; read the paper
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}