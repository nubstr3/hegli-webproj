import type { Metadata } from "next";
import Link from "next/link";
import MobileShell from "../components/MobileShell";
import MobileSlideshow from "./MobileSlideshow";
import MobileExit from "./MobileExit";
import { loadTravel, postedAt } from "./travelData";
import { ACCENT, BG_PANEL, FONT_MONO, PROMPT_USER, TEXT_DIM, TEXT_MUTED, TEXT_PRIMARY } from "@/app/components/theme";

export const metadata: Metadata = { title: "travel", robots: { index: false, follow: false } };

const RULE = "1px solid #26292d";

export default async function MobileTravelPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { owner, viewerLabel, posts, index, post, photos, fileName, href } = await loadTravel((await searchParams).p);

  const older = index < posts.length - 1 ? index + 1 : null;
  const newer = index > 0 ? index - 1 : null;
  const posted = post ? postedAt(post.published_at, post.tz) : null;
  const earlier = posts.map((p, i) => ({ p, i })).filter(({ i }) => i !== index);

  const navBtn = (label: string, to: number | null) =>
    to === null ? (
      <span style={{ flex: 1, minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #2a2d31", borderRadius: 6, color: TEXT_DIM }}>{label}</span>
    ) : (
      <Link href={href(to)} style={{ flex: 1, minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${ACCENT}`, borderRadius: 6, color: ACCENT, textDecoration: "none" }}>
        {label}
      </Link>
    );

  return (
    <MobileShell>
      <div style={{ paddingTop: 22, paddingBottom: 24, fontFamily: FONT_MONO, fontSize: 13, lineHeight: 1.7, color: TEXT_PRIMARY }}>
        <div style={{ fontSize: 12, lineHeight: 1.6, overflowWrap: "anywhere" }}>
          <span style={{ color: ACCENT, fontWeight: 700 }}>{PROMPT_USER}</span>
          <span style={{ color: TEXT_MUTED }}>:~/travel$</span> {post ? `cat ${fileName(post, index)}` : "ls"}
        </div>

        <div style={{ marginTop: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 12, color: TEXT_MUTED }}>
          <span style={{ overflowWrap: "anywhere" }}>
            viewing as <span style={{ color: TEXT_PRIMARY }}>{viewerLabel}</span>
          </span>
          {owner ? (
            <Link href="/admin" style={{ minHeight: 44, display: "flex", alignItems: "center", color: "#cfcfd4", textDecoration: "none" }}>
              &#10140; admin
            </Link>
          ) : (
            <MobileExit />
          )}
        </div>

        {!post ? (
          <div style={{ marginTop: 6, border: "1px dashed #2a2d31", borderRadius: 8, padding: "32px 20px", color: TEXT_MUTED }}>no entries yet. check back soon.</div>
        ) : (
          <>
            <div style={{ marginTop: 6, background: BG_PANEL, border: RULE, borderRadius: 8, boxShadow: "0 24px 70px rgba(0,0,0,0.5)", overflow: "hidden" }}>
              <div style={{ padding: "14px 14px 12px", borderBottom: RULE, background: "#17181b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, lineHeight: 1.2, fontWeight: 500, color: "#e8eaec", overflowWrap: "anywhere" }}>
                  <span aria-hidden="true" style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />
                  {fileName(post, index)}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.5, color: TEXT_MUTED }}>
                  {[post.post_date, post.location, posted ? `posted ${posted}` : null].filter(Boolean).join(" · ")}
                </div>
              </div>

              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 16 }}>
                {photos.length > 0 && <MobileSlideshow key={post.id} photos={photos} />}
                {post.entry && (
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: TEXT_PRIMARY, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{post.entry}</p>
                )}
              </div>

              <div style={{ minHeight: 36, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 14px", background: "#101113", borderTop: RULE, fontSize: 11, color: TEXT_MUTED }}>
                <span>
                  {photos.length} photo{photos.length === 1 ? "" : "s"} · UTF-8
                </span>
                <span>
                  post {posts.length - index} of {posts.length}
                </span>
              </div>
            </div>

            {posts.length > 1 && (
              <div style={{ marginTop: 14, display: "flex", gap: 10, fontSize: 13 }}>
                {navBtn("[ ← older ]", older)}
                {navBtn("[ newer → ]", newer)}
              </div>
            )}

            {earlier.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22, fontSize: 12, color: TEXT_MUTED }}>
                  <span># other entries</span>
                  <span style={{ flex: 1, borderTop: "1px dotted #2a2d31" }} />
                </div>
                <div style={{ marginTop: 10, background: BG_PANEL, border: RULE, borderRadius: 8, overflow: "hidden" }}>
                  {earlier.map(({ p, i }, n) => {
                    const count = p.journal_photos?.[0]?.count ?? 0;
                    return (
                      <Link
                        key={p.id}
                        href={href(i)}
                        style={{ minHeight: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 14px", borderBottom: n === earlier.length - 1 ? "none" : "1px solid #1d1f23", textDecoration: "none", color: "#e8eaec" }}
                      >
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 12, overflowWrap: "anywhere" }}>{fileName(p, i)}</span>
                          <span style={{ display: "block", marginTop: 2, fontSize: 11, color: TEXT_MUTED }}>
                            {p.post_date} · {count} photo{count === 1 ? "" : "s"}
                          </span>
                        </span>
                        <span style={{ flexShrink: 0, fontSize: 12, color: TEXT_MUTED }}>&rarr;</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </MobileShell>
  );
}