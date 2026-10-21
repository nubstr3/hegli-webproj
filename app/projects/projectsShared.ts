// Shared (client + server safe) pieces for the public /projects page and the
// admin editor: tier styling, database row types and row -> card mapping.

import { ACCENT, ACCENT_BETA, BG_PANEL, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from "@/app/components/theme";
import type { ProjectEntry, PublicationEntry } from "./projectsData";

export type TierId = "live" | "beta" | "building" | "queued";
export const TIER_ORDER: TierId[] = ["live", "beta", "building", "queued"];
export const DATE_LABELS = ["finished", "updated", "added"] as const;

export type TierMeta = {
  id: TierId;
  heading: string; // "# live"
  adminLabel: string; // shown in the admin tier picker
  badge: string;
  color: string;
  border: string;
  badgeBorder: string;
  background: string;
  titleColor: string;
  textOpacity: number;
  noLinkFallback: string;
};

export const TIER_META: Record<TierId, TierMeta> = {
  live: {
    id: "live",
    heading: "# live",
    adminLabel: "live",
    badge: "LIVE",
    color: ACCENT,
    border: `1px solid ${ACCENT}`,
    badgeBorder: `1px solid ${ACCENT}`,
    background: BG_PANEL,
    titleColor: ACCENT,
    textOpacity: 0.85,
    noLinkFallback: "no public link",
  },
  beta: {
    id: "beta",
    heading: "# beta",
    adminLabel: "beta",
    badge: "BETA",
    color: ACCENT_BETA,
    border: `1px solid ${ACCENT_BETA}`,
    badgeBorder: `1px solid ${ACCENT_BETA}`,
    background: BG_PANEL,
    titleColor: TEXT_PRIMARY,
    textOpacity: 0.85,
    noLinkFallback: "in TestFlight — not public yet",
  },
  building: {
    id: "building",
    heading: "# in development",
    adminLabel: "in development",
    badge: "BUILDING",
    color: TEXT_MUTED,
    border: "1px dashed rgba(255,255,255,0.18)",
    badgeBorder: `1px dashed ${TEXT_MUTED}`,
    background: "rgba(255,255,255,0.015)",
    titleColor: TEXT_PRIMARY,
    textOpacity: 0.7,
    noLinkFallback: "building — no link yet",
  },
  queued: {
    id: "queued",
    heading: "# queued",
    adminLabel: "queued",
    badge: "QUEUED",
    color: TEXT_FAINT,
    border: "1px dotted rgba(255,255,255,0.12)",
    badgeBorder: `1px dotted ${TEXT_FAINT}`,
    background: "transparent",
    titleColor: TEXT_MUTED,
    textOpacity: 0.55,
    noLinkFallback: "not started — idea stage",
  },
};

// --- database rows (tables: public.projects, public.publications) ---

export type ProjectRow = {
  id: string;
  tier: TierId;
  name: string;
  description: string;
  stack: string[];
  updated_label: (typeof DATE_LABELS)[number];
  updated: string;
  live_url: string | null;
  github_url: string | null;
  sort_order: number;
};

export type PublicationRow = {
  id: string;
  title: string;
  venue: string;
  authors: string;
  summary: string;
  url: string;
  sort_order: number;
};

export function rowToProject(r: ProjectRow): ProjectEntry {
  return {
    name: r.name,
    description: r.description,
    stack: r.stack ?? [],
    updatedLabel: r.updated_label,
    updated: r.updated,
    liveUrl: r.live_url || undefined,
    githubUrl: r.github_url || undefined,
  };
}

export function rowToPublication(r: PublicationRow): PublicationEntry {
  return { title: r.title, venue: r.venue, authors: r.authors, summary: r.summary, url: r.url };
}