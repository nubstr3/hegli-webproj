import MobileShell from "../components/MobileShell";
import MobileAbout from "../components/MobileAbout";
import MobileUpdates from "../components/MobileUpdates";
import { getAboutContent } from "@/app/about/aboutContent";

export default async function MobileAboutPage() {
  const { about, updates } = await getAboutContent();

  return (
    <MobileShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 20, paddingBottom: 24 }}>
        <MobileAbout headline={about.headline} bio={about.bio} playing={about.playing} />
        <MobileUpdates updates={updates} />
      </div>
    </MobileShell>
  );
}