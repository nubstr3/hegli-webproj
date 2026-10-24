// Server-only: loads what the mobile travel page shows. Same access rules and queries as
// app/travel/page.tsx (a valid code for "travel", or the signed-in owner; drafts never leave the database).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { SESSION_COOKIE, adminClient, verifyAccessToken } from "@/lib/accessCore.mjs";

const BUCKET = "files";
const SIGNED_URL_SECONDS = 60 * 60;

export type Post = {
  id: string;
  entry: string;
  post_date: string;
  location: string | null;
  tz: string | null;
  published_at: string | null;
  journal_photos: { count: number }[];
};

export type SlidePhoto = { url: string; width: number; height: number };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

const TZ_NAMES: Record<string, string> = { "Asia/Tokyo": "JST", "Asia/Seoul": "KST" };

/** "7:42pm JST" in the zone the post was written in. */
export function postedAt(iso: string | null, tz: string | null) {
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

export async function loadTravel(wanted: string | undefined) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const codeAccess = await verifyAccessToken(token, "travel");
  // The site owner, signed in to the admin, can always read it without a code.
  const owner = codeAccess ? false : await isAdmin();

  // No valid code-login and not the owner: back to the homepage like it was never here.
  if (!codeAccess && !owner) redirect("/");
  const viewerLabel = codeAccess ? codeAccess.label : "admin";

  const admin = adminClient();
  const { data } = await admin
    .from("journal_posts")
    .select("id, entry, post_date, location, tz, published_at, journal_photos(count)")
    .eq("status", "published") // drafts never leave the database
    .order("post_date", { ascending: false })
    .order("published_at", { ascending: false });
  const posts = (data ?? []) as unknown as Post[];

  const index = Math.max(0, posts.findIndex((p) => p.id === wanted));
  const post = posts[index];

  // photos for the open post only, with short-lived links made after the check above
  let photos: SlidePhoto[] = [];
  if (post) {
    const { data: rows, error: rowsError } = await admin
      .from("journal_photos")
      .select("position, width, height, files ( path, deleted_at )")
      .eq("post_id", post.id)
      .order("position", { ascending: true });
    if (rowsError) console.error("[travel] couldn't read photos:", rowsError.message);
    type Joined = {
      width: number;
      height: number;
      files: { path: string; deleted_at: string | null } | { path: string; deleted_at: string | null }[] | null;
    };
    const usable = ((rows ?? []) as unknown as Joined[])
      .map((r) => ({ width: r.width, height: r.height, file: Array.isArray(r.files) ? r.files[0] : r.files }))
      .filter((r) => r.file && !r.file.deleted_at);
    if (usable.length) {
      const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUrls(
        usable.map((r) => r.file!.path),
        SIGNED_URL_SECONDS,
      );
      if (signError) console.error("[travel] couldn't sign photo links:", signError.message);
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

  return { owner, viewerLabel, posts, index, post, photos, fileName, href };
}