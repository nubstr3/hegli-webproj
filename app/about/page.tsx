import PageShell from "@/app/components/PageShell";
import AboutNotepad from "./AboutNotepad";
import UpdatesLog from "./UpdatesLog";
import { getAboutContent } from "./aboutContent";

export default async function AboutPage() {
  const { about, updates } = await getAboutContent();

  return (
    <PageShell>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          padding: "48px 24px 80px",
        }}
      >
        <AboutNotepad headline={about.headline} bio={about.bio} playing={about.playing} />
        <UpdatesLog updates={updates} />
      </div>
    </PageShell>
  );
}