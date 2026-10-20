import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_MUTED } from "@/app/components/theme";

type Project = {
  title: string;
  description: string;
  slug: string;
  status: "live" | "soon";
};

const projects: Project[] = [
  {
    title: "ecommerce/",
    description: "Sidebar filters, sale gate, dark neon palette",
    slug: "ecommerce",
    status: "live",
  },
  {
    title: "hotel/",
    description: "Password gate, booking widget, gold on navy",
    slug: "hotel",
    status: "live",
  },
  {
    title: "news/",
    description: "Patch notes for LoL + Overwatch, in progress",
    slug: "news",
    status: "soon",
  },
];

export default function ProjectsPage() {
  return (
    <PageShell>
      <div style={{ flex: 1, padding: "48px 64px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, marginBottom: 36 }}>
          Things I&apos;ve shipped
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {projects.map((p) => (
            <div
              key={p.slug}
              style={{
                width: 380,
                padding: 28,
                background: BG_PANEL,
                border: `1px solid ${BORDER_SUBTLE}`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 6,
                  border: p.status === "live" ? `1px solid ${ACCENT}` : "1px dashed rgba(255,255,255,0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                  color: p.status === "live" ? ACCENT : "#6B6B72",
                  fontFamily: FONT_MONO,
                }}
              >
                [ ]
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 600, marginTop: 18 }}>
                {p.title}
              </div>
              <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8, lineHeight: 1.5 }}>
                {p.description}
              </div>

              {p.status === "live" ? (
                <Link
                  href={`/projects/${p.slug}`}
                  style={{
                    display: "inline-block",
                    marginTop: 16,
                    fontSize: 12,
                    color: ACCENT,
                    border: `1px solid ${ACCENT}`,
                    borderRadius: 999,
                    padding: "4px 12px",
                    textDecoration: "none",
                  }}
                >
                  Live
                </Link>
              ) : (
                <div
                  style={{
                    display: "inline-block",
                    marginTop: 16,
                    fontSize: 12,
                    color: "#8C8C94",
                    border: "1px dashed #6B6B72",
                    borderRadius: 999,
                    padding: "4px 12px",
                  }}
                >
                  Coming soon
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
