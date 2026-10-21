// Server-only: loads the public /projects content from Supabase. If the
// tables don't exist yet or can't be reached, falls back to projectsData.ts
// so the page never breaks.

import { createClient } from "@/lib/supabase-server";
import { BETA_PROJECTS, BUILDING_PROJECTS, LIVE_PROJECTS, PUBLICATIONS, QUEUED_PROJECTS } from "./projectsData";
import type { ProjectEntry, PublicationEntry } from "./projectsData";
import { rowToProject, rowToPublication, TIER_ORDER } from "./projectsShared";
import type { ProjectRow, PublicationRow, TierId } from "./projectsShared";

export type ProjectsContent = {
  byTier: Record<TierId, ProjectEntry[]>;
  publications: PublicationEntry[];
};

const FALLBACK: ProjectsContent = {
  byTier: { live: LIVE_PROJECTS, beta: BETA_PROJECTS, building: BUILDING_PROJECTS, queued: QUEUED_PROJECTS },
  publications: PUBLICATIONS,
};

export async function getProjectsContent(): Promise<ProjectsContent> {
  try {
    const supabase = await createClient();
    const [projects, pubs] = await Promise.all([
      supabase.from("projects").select("*").order("sort_order", { ascending: true }),
      supabase.from("publications").select("*").order("sort_order", { ascending: true }),
    ]);
    if (projects.error || pubs.error) return FALLBACK;

    const byTier: Record<TierId, ProjectEntry[]> = { live: [], beta: [], building: [], queued: [] };
    for (const row of (projects.data ?? []) as ProjectRow[]) {
      if (TIER_ORDER.includes(row.tier)) byTier[row.tier].push(rowToProject(row));
    }
    return {
      byTier,
      publications: ((pubs.data ?? []) as PublicationRow[]).map(rowToPublication),
    };
  } catch {
    return FALLBACK;
  }
}