import type { CSSProperties } from "react";
import { BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from "@/app/components/theme";
import type { ProjectEntry, PublicationEntry } from "@/app/projects/projectsData";
import type { TierMeta } from "@/app/projects/projectsShared";

// Links sit in a bottom row of full-height (52px) tap targets.
const linkStyle: CSSProperties = {
  minHeight: 52,
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  color: "#cfcfd4",
  textDecoration: "none",
};

const chip: CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #2c2c32",
  borderRadius: 3,
  fontSize: 11,
  lineHeight: 1,
  color: "#b8b8c2",
};

/** Touch version of ProjectCard. Tier styling (live / beta / building / queued) comes from the same TIER_META. */
export function MobileProjectCard({ p, tier }: { p: ProjectEntry; tier: TierMeta }) {
  return (
    <div style={{ border: tier.border, borderRadius: 8, background: tier.background, padding: "18px 16px 0", fontFamily: FONT_MONO }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 15, lineHeight: 1.3, fontWeight: 700, color: tier.titleColor, overflowWrap: "anywhere" }}>
          {p.name}/
        </span>
        <span
          style={{
            flexShrink: 0,
            padding: "5px 9px",
            border: tier.badgeBorder,
            borderRadius: 4,
            fontSize: 10,
            lineHeight: 1,
            letterSpacing: "0.06em",
            color: tier.color,
          }}
        >
          {tier.badge}
        </span>
      </div>
      <div style={{ marginTop: 6, fontSize: 10, lineHeight: 1, letterSpacing: "0.06em", color: "#8a8a93", textTransform: "uppercase" }}>
        {p.updatedLabel} {p.updated}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          lineHeight: 1.7,
          color: TEXT_PRIMARY,
          opacity: tier.textOpacity,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {p.description}
      </div>
      {p.stack.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {p.stack.map((s, i) => (
            <span key={`${s}-${i}`} style={chip}>
              {s}
            </span>
          ))}
        </div>
      )}
      <div style={{ marginTop: 14, borderTop: `1px solid ${BORDER_SUBTLE}`, display: "flex", flexWrap: "wrap", columnGap: 24 }}>
        {p.liveUrl && (
          <a href={p.liveUrl} style={linkStyle}>
            <span style={{ color: "#8a8a93" }}>&rarr;</span>visit site
          </a>
        )}
        {p.githubUrl && (
          <a href={p.githubUrl} style={linkStyle}>
            <span style={{ color: "#8a8a93" }}>&rarr;</span>view on github
          </a>
        )}
        {!p.liveUrl && !p.githubUrl && (
          <span style={{ ...linkStyle, color: TEXT_FAINT }}>{tier.noLinkFallback}</span>
        )}
      </div>
    </div>
  );
}

/** Touch version of PublicationCard. */
export function MobilePublicationCard({ pub }: { pub: PublicationEntry }) {
  return (
    <div style={{ border: `1px solid ${BORDER_SUBTLE}`, borderRadius: 8, background: BG_PANEL, padding: "18px 16px 0", fontFamily: FONT_MONO }}>
      <div style={{ fontSize: 14, lineHeight: 1.4, fontWeight: 700, color: TEXT_PRIMARY, overflowWrap: "anywhere" }}>{pub.title}</div>
      <div style={{ marginTop: 8, display: "inline-block", padding: "5px 9px", border: `1px solid ${BORDER_SUBTLE}`, borderRadius: 4, fontSize: 10, lineHeight: 1.2, color: TEXT_MUTED }}>
        {pub.venue}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, lineHeight: 1.5, color: TEXT_FAINT }}>{pub.authors}</div>
      <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7, color: TEXT_PRIMARY, opacity: 0.8, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {pub.summary}
      </div>
      <div style={{ marginTop: 14, borderTop: `1px solid ${BORDER_SUBTLE}`, display: "flex" }}>
        {pub.url && (
          <a href={pub.url} style={linkStyle}>
            <span style={{ color: "#8a8a93" }}>&rarr;</span>read the paper
          </a>
        )}
      </div>
    </div>
  );
}