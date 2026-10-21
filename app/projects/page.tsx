import PageShell from "@/app/components/PageShell";
import {
  ACCENT,
  BORDER_SUBTLE,
  FONT_MONO,
  PROMPT_USER,
  TEXT_DIM,
  TEXT_FAINT,
  TEXT_MUTED,
} from "@/app/components/theme";
import { ProjectCard, PublicationCard } from "./ProjectCard";
import { getProjectsContent } from "./projectsContent";
import { TIER_META, TIER_ORDER } from "./projectsShared";

export default async function ProjectsPage() {
  const { byTier, publications } = await getProjectsContent();

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

        {TIER_ORDER.map((id) => {
          const tier = TIER_META[id];
          return (
            <div key={tier.id} style={{ marginBottom: 44 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
                <span style={{ color: TEXT_FAINT, fontSize: 13 }}>{tier.heading}</span>
                <span style={{ flex: 1, height: 1, background: BORDER_SUBTLE }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {byTier[id].map((p, i) => (
                  <ProjectCard key={`${tier.id}-${i}`} p={p} tier={tier} />
                ))}
              </div>
            </div>
          );
        })}

        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
            <span style={{ color: TEXT_FAINT, fontSize: 13 }}># publications</span>
            <span style={{ flex: 1, height: 1, background: BORDER_SUBTLE }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {publications.map((pub, i) => (
              <PublicationCard key={`pub-${i}`} pub={pub} />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}