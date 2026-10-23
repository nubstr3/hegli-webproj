import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PageShell from "@/app/components/PageShell";
import { SESSION_COOKIE, adminClient, verifyAccessToken } from "@/lib/accessCore.mjs";
import {
  ACCENT,
  BG_PANEL,
  FONT_MONO,
  PROMPT_USER,
  TEXT_DIM,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from "@/app/components/theme";
import ExitButton from "./ExitButton";
import Slideshow, { type SlidePhoto } from "./Slideshow";

export const metadata: Metadata = { title: "travel", robots: { index: false, follow: false } };

const BUCKET = "files";
const SIGNED_URL_SECONDS = 60 * 60;
const RULE = "1px solid #26292d";

type Post = {
  id: string;
  entry: string;
  post_date: string;
  location: string | null;
  tz: string | null;
  published_at: string | null;
  journal_photos: { count: number }[];
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

const TZ_NAMES: Record<string, string> = { "Asia/Tokyo": "JST", "Asia/Seoul": "KST" };

/** "7:42pm JST" in the zone the post was written in. */
function postedAt(iso: string | null, tz: string | null) {
  if (!iso) return null;
  try {
    const zone = tz || "UTC";
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: zone,
      timeZoneName: "short",
    }).formatToParts(new Date(iso));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const zoneName = TZ_NAMES[zone] ?? get("timeZoneName");
    return `${get("hour")}:${get("minute")}${get("dayPeriod").toLowerCase()} ${zoneName}`;
  } catch {
    return null;
  }
}

export default async function TravelPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const access = await verifyAccessToken(token, "travel");

  // No valid code-login, no page: back to the homepage like it was never here.
  if (!access) redirect("/");

  const admin = adminClient();
  const { data } = await admin
    .from("journal_posts")
    .select("id, entry, post_date, location, tz, published_at, journal_photos(count)")
    .eq("status", "published") // drafts never leave the database
    .order("post_date", { ascending: false })
    .order("published_at", { ascending: false });
  const posts = (data ?? []) as unknown as Post[];

  const wanted = (await searchParams).p;
  const index = Math.max(0, posts.findIndex((p) => p.id === wanted));
  const post = posts[index];

  // photos for the open post only, with short-lived links made after the check above
  let photos: SlidePhoto[] = [];
  if (post) {
    const { data: rows } = await admin
      .from("journal_photos")
      .select("position, width, height, files ( path, deleted_at )")
      .eq("post_id", post.id)
      .order("position", { ascending: true });
    type Joined = {
      width: number;
      height: number;
      files: { path: string; deleted_at: string | null } | { path: string; deleted_at: string | null }[] | null;
    };
    const usable = ((rows ?? []) as unknown as Joined[])
      .map((r) => ({ width: r.width, height: r.height, file: Array.isArray(r.files) ? r.files[0] : r.files }))
      .filter((r) => r.file && !r.file.deleted_at);
    if (usable.length) {
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrls(
        usable.map((r) => r.file!.path),
        SIGNED_URL_SECONDS,
      );
      photos = usable.flatMap((r, i) => {
        const url = signed?.[i]?.signedUrl;
        return url ? [{ url, width: r.width, height: r.height }] : [];
      });
    }
  }

  // day numbers count up from the first post
  const dayOf = (i: number) => String(posts.length - i).padStart(2, "0");
  const fileName = (p: Post, i: number) => `day-${dayOf(i)}-${slug(p.location?.split(",")[0] ?? "") || "log"}.log`;
  const href = (i: number) => (i === 0 ? "/travel" : `/travel?p=${posts[i].id}`);

  const older = index < posts.length - 1 ? index + 1 : null;
  const newer = index > 0 ? index - 1 : null;
  const posted = post ? postedAt(post.published_at, post.tz) : null;
  const earlier = posts.map((p, i) => ({ p, i })).filter(({ i }) => i !== index);

  const navBtn = (label: string, to: number | null) =>
    to === null ? (
      <span
        style={{
          minHeight: 44,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          border: "1px dashed #2a2d31",
          borderRadius: 4,
          color: TEXT_DIM,
        }}
      >
        {label}
      </span>
    ) : (
      <Link
        href={href(to)}
        style={{
          minHeight: 44,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          border: `1px solid ${ACCENT}`,
          borderRadius: 4,
          color: ACCENT,
          textDecoration: "none",
        }}
      >
        {label}
      </Link>
    );

  return (
    <PageShell>
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1040,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "36px 24px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          fontFamily: FONT_MONO,
          fontSize: 13,
          lineHeight: 1.7,
          color: TEXT_PRIMARY,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ color: ACCENT, fontWeight: 700 }}>{PROMPT_USER}</span>
            <span style={{ color: TEXT_MUTED }}>:~/travel$</span> {post ? `cat ${fileName(post, index)}` : "ls"}
          </div>
          <div style={{ display: "flex", gap: 20, color: TEXT_MUTED }}>
            <span>{access.label}</span>
            <ExitButton />
          </div>
        </div>

        {!post ? (
          <div style={{ border: "1px dashed #2a2d31", borderRadius: 6, padding: "40px 24px", color: TEXT_MUTED }}>
            no entries yet. check back soon.
          </div>
        ) : (
          <>
            <div
              style={{
                background: BG_PANEL,
                border: RULE,
                borderRadius: 6,
                boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  minHeight: 40,
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  background: "#17181b",
                  borderBottom: RULE,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderRight: RULE, color: "#e8eaec" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />
                  {fileName(post, index)}
                </div>
                <div style={{ display: "flex", alignItems: "center", padding: "6px 16px", color: TEXT_MUTED }}>
                  {[post.post_date, post.location, posted ? `posted ${posted}` : null].filter(Boolean).join(" · ")}
                </div>
              </div>

              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                {photos.length > 0 && <Slideshow key={post.id} photos={photos} />}
                {post.entry && (
                  <p
                    style={{
                      margin: "0 auto",
                      width: "100%",
                      maxWidth: "76ch",
                      fontSize: 14,
                      lineHeight: 1.85,
                      color: TEXT_PRIMARY,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {post.entry}
                  </p>
                )}
              </div>

              <div
                style={{
                  minHeight: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                  background: "#101113",
                  borderTop: RULE,
                  fontSize: 12,
                  color: TEXT_MUTED,
                }}
              >
                <span>
                  {fileName(post, index)} · {photos.length} photo{photos.length === 1 ? "" : "s"} · UTF-8
                </span>
                <span>
                  post {posts.length - index} of {posts.length}
                </span>
              </div>
            </div>

            {posts.length > 1 && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {navBtn("[ ← older ]", older)}
                {navBtn("[ newer → ]", newer)}
              </div>
            )}

            {earlier.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, color: TEXT_MUTED }}>
                  <span># other entries</span>
                  <span style={{ flex: 1, borderTop: "1px dotted #2a2d31" }} />
                </div>
                <div style={{ background: BG_PANEL, border: RULE, borderRadius: 6, overflow: "hidden" }}>
                  {earlier.map(({ p, i }, n) => {
                    const count = p.journal_photos?.[0]?.count ?? 0;
                    return (
                      <Link
                        key={p.id}
                        href={href(i)}
                        className="hegli-act"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          padding: "12px 18px",
                          borderBottom: n === earlier.length - 1 ? "none" : "1px solid #1d1f23",
                          textDecoration: "none",
                          color: "#e8eaec",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ flex: "3 1 160px" }}>{fileName(p, i)}</span>
                        <span style={{ flex: "1.4 1 100px", color: TEXT_MUTED }}>{p.post_date}</span>
                        <span style={{ flex: "1 1 70px", color: TEXT_MUTED }}>
                          {count} photo{count === 1 ? "" : "s"}
                        </span>
                        <span style={{ flex: "0 0 auto", color: TEXT_MUTED }}>→ open</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}