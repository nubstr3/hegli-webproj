import MobileShell from "../components/MobileShell";
import { MobileProjectCard, MobilePublicationCard } from "../components/MobileProjectCard";
import { getProjectsContent } from "@/app/projects/projectsContent";
import { TIER_META, TIER_ORDER } from "@/app/projects/projectsShared";
import { ACCENT, BORDER_SUBTLE, FONT_MONO, PROMPT_USER, TEXT_DIM, TEXT_FAINT } from "@/app/components/theme";

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, lineHeight: 1, color: "#8a8a93" }}>
      <span style={{ color: TEXT_FAINT }}>{label}</span>
      <span aria-hidden="true" style={{ flex: 1, height: 1, background: BORDER_SUBTLE }} />
    </div>
  );
}

export default async function MobileProjectsPage() {
  const { byTier, publications } = await getProjectsContent();

  return (
    <MobileShell>
      <div style={{ paddingTop: 24, paddingBottom: 24, fontFamily: FONT_MONO }}>
        <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          <span style={{ color: ACCENT, fontWeight: 700 }}>{PROMPT_USER}</span>
          <span style={{ color: TEXT_DIM }}>:~/projects$</span> <span style={{ color: "#f2f2f4" }}>ls -la</span>
        </div>

        {TIER_ORDER.map((id) => {
          const tier = TIER_META[id];
          const items = byTier[id];
          if (!items.length) return null;
          return (
            <section key={id} style={{ marginTop: 22 }}>
              <Divider label={tier.heading} />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                {items.map((p, i) => (
                  <MobileProjectCard key={`${id}-${i}`} p={p} tier={tier} />
                ))}
              </div>
            </section>
          );
        })}

        {publications.length > 0 && (
          <section style={{ marginTop: 22 }}>
            <Divider label="# publications" />
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {publications.map((pub, i) => (
                <MobilePublicationCard key={`pub-${i}`} pub={pub} />
              ))}
            </div>
          </section>
        )}
      </div>
    </MobileShell>
  );
}