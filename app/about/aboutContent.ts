// Server-only: loads the public About page content from Supabase.

import { createClient } from "@/lib/supabase-server";
import { ABOUT_DEFAULTS, ABOUT_KEYS, rowsToAbout } from "./aboutShared";
import type { AboutFields, UpdateEntry } from "./aboutShared";

/** Server-side: everything the public About page needs. */
export async function getAboutContent(): Promise<{ about: AboutFields; updates: UpdateEntry[] }> {
  try {
    const supabase = await createClient();
    const [content, updates] = await Promise.all([
      supabase.from("site_content").select("key, value").in("key", Object.values(ABOUT_KEYS)),
      supabase
        .from("updates")
        .select("id, posted_on, title, body")
        .order("posted_on", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    return {
      about: rowsToAbout(content.error ? null : content.data),
      updates: updates.error ? [] : ((updates.data ?? []) as UpdateEntry[]),
    };
  } catch {
    return { about: ABOUT_DEFAULTS, updates: [] };
  }
}