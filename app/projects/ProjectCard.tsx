import type { CSSProperties } from "react";
import { BG_PANEL, BORDER_SUBTLE, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from "@/app/components/theme";
import type { ProjectEntry, PublicationEntry } from "./projectsData";
import type { TierMeta } from "./projectsShared";

const linkStyle: CSSProperties = {
  color: TEXT_MUTED,
  fontSize: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  textDecoration: "none",
};

/** One project card. Used by the public /projects page and the admin live preview. */
export function ProjectCard({ p, tier }: { p: ProjectEntry; tier: TierMeta }) {
  return (
    <div
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

      <p style={{ color: TEXT_PRIMARY, fontSize: 13, lineHeight: 1.6, margin: "10px 0 14px", opacity: tier.textOpacity, whiteSpace: "pre-wrap" }}>
        {p.description}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {p.stack.map((s, i) => (
          <span
            key={`${s}-${i}`}
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
        {!p.liveUrl && !p.githubUrl && <span style={{ color: TEXT_FAINT, fontSize: 12 }}>{tier.noLinkFallback}</span>}
      </div>
    </div>
  );
}

/** One publication card. */
export function PublicationCard({ pub }: { pub: PublicationEntry }) {
  return (
    <div
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
      <p style={{ color: TEXT_PRIMARY, fontSize: 13, lineHeight: 1.6, margin: "10px 0 14px", opacity: 0.8, whiteSpace: "pre-wrap" }}>
        {pub.summary}
      </p>
      <div style={{ display: "flex", gap: 20, borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 14 }}>
        {pub.url && (
          <a href={pub.url} style={linkStyle}>
            &rarr; read the paper
          </a>
        )}
      </div>
    </div>
  );
}