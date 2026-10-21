// Shared (client + server safe) types, keys and defaults for the /about content.
// Content for the public /about page. It lives in Supabase (edited from
// /admin/about); these defaults are the fallback if the tables are empty or
// can't be reached, so the page never breaks.

export type AboutFields = { headline: string; bio: string; playing: string };

export type UpdateEntry = {
  id: string;
  posted_on: string; // YYYY-MM-DD
  title: string;
  body: string;
};

export const ABOUT_KEYS = {
  headline: "about_headline",
  bio: "about_bio",
  playing: "about_playing",
} as const;

export const ABOUT_DEFAULTS: AboutFields = {
  headline: "Henry — developer, dillydallyer, player 1.",
  bio: "Based in Auckland, building hegli.dev as a sandbox for real features: admin dashboards, auth, APIs, and the occasional bit of UI experimentation along the way.",
  playing: "Swift, SwiftUI, TestFlight",
};

/** Turn site_content rows into the three about fields (missing keys fall back to defaults). */
export function rowsToAbout(rows: { key: string; value: string }[] | null): AboutFields {
  const map = new Map((rows ?? []).map((r) => [r.key, r.value]));
  return {
    headline: map.get(ABOUT_KEYS.headline) ?? ABOUT_DEFAULTS.headline,
    bio: map.get(ABOUT_KEYS.bio) ?? ABOUT_DEFAULTS.bio,
    playing: map.get(ABOUT_KEYS.playing) ?? ABOUT_DEFAULTS.playing,
  };
}