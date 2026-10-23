import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PageShell from "@/app/components/PageShell";
import { SESSION_COOKIE, verifyAccessToken } from "@/lib/accessCore.mjs";
import { ACCENT, FONT_MONO, PROMPT_USER, TEXT_DIM, TEXT_MUTED, TEXT_PRIMARY } from "@/app/components/theme";

// Placeholder for step 2: proves the gate works. The real travel journal replaces this in step 3.
export default async function TravelPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const access = await verifyAccessToken(token, "travel");

  // No valid code-login, no page: back to the homepage like it was never here.
  if (!access) redirect("/");

  return (
    <PageShell>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "48px 24px 80px",
          fontFamily: FONT_MONO,
          fontSize: 15,
          lineHeight: 1.85,
          color: TEXT_PRIMARY,
        }}
      >
        <div>
          <span style={{ color: TEXT_DIM }}>{PROMPT_USER}</span>
          <span style={{ color: TEXT_DIM }}>:~/travel$</span> cat travel.log
        </div>
        <div style={{ color: ACCENT }}>[ ok ] hello, {access.label}</div>
        <div style={{ color: TEXT_MUTED }}>the journal itself is coming in the next step.</div>
      </div>
    </PageShell>
  );
}