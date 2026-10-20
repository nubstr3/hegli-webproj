// Real project content lives here, separate from the page's layout/styling
// (app/projects/page.tsx) so it's easy to come back and edit. Placeholders
// are wrapped in [BRACKETS] — replace them with the real details.

export interface ProjectEntry {
  name: string;
  description: string;
  stack: string[];
  updatedLabel: string; // "finished" | "updated" | "added"
  updated: string; // e.g. "Oct 2026"
  liveUrl?: string;
  githubUrl?: string;
}

export interface PublicationEntry {
  title: string;
  venue: string;
  authors: string;
  summary: string;
  url: string;
}

export const LIVE_PROJECTS: ProjectEntry[] = [
  {
    name: "hegli.dev",
    description:
      "This site - a personal workspace and portfolio, plus an admin dashboard. Also where I experiment with new features and ideas.",
    stack: ["Next.js", "Supabase", "Vercel", "Tailwind CSS"],
    updatedLabel: "updated",
    updated: "OCT 2026",
    liveUrl: "https://hegli.dev",
    githubUrl: "https://github.com/nubstr3/hegli-webproj",
  },
  {
    name: "the-devereux-hotel",
    description: "A boutique hotel booking site with an embedded booking widget",
    stack: ["Next.js", "Vercel", "Tailwind CSS"],
    updatedLabel: "finished",
    updated: "OCT 2026",
    liveUrl: "https://thedevereux.co.nz",
    githubUrl: "https://github.com/nubstr3/devereux-boutique-hotel",
  },
  {
    name: "code-playground",
    description: "A university project developed with 4 other colleagues - coding sandbox website for students. Site may no longer be live but code is on available on GitHub.",
    stack: ["Python v3.7", "Jobe", "MySQL v5.7.36", "Navicat Premium v15.0.23", "Django v3.2.15",],
    updatedLabel: "finished",
    updated: "NOV 2022",
    liveUrl: "http://www.codeplayground.club/",
    githubUrl: "https://github.com/nubstr3/code-playground",
  },
  {
    name: "FreeDem",
    description: "A university project - lightweight IoT mobile app used to manage dementia patients. No longer actively maintained; code is on GitHub.",
    stack: ["React Native", "Expo Go"],
    updatedLabel: "finished",
    updated: "JUN 2024",
    githubUrl: "https://github.com/nubstr3/FreeDem-COMP826-Project",
  },
];

export const BETA_PROJECTS: ProjectEntry[] = [
  {
    name: "FLEX",
    description: "A trip itinerary planner and travel companion. In the Apple Developer Program, testing via TestFlight.",
    stack: ["React Native", "Expo SDK55", "Expo Go", "TestFlight"],
    updatedLabel: "updated",
    updated: "OCT 2026",
    githubUrl: "https://github.com/nubstr3/flex",
  },
  {
    name: "PackWise",
    description: "A packing tracker and checklist app with weighted bags and trips. In the Apple Developer Program, testing via TestFlight.",
    stack: ["React Native", "Expo SDK55", "Expo Go", "TestFlight"],
    updatedLabel: "updated",
    updated: "SEP 2026",
    githubUrl: "https://github.com/nubstr3/packwise",
  },
];

export const BUILDING_PROJECTS: ProjectEntry[] = [
  {
    name: "atlas-fitness",
    description: "A ecommerce website selling commercial and home use fitness equipment",
    stack: ["Next.js", "Vercel", "Shopify API"],
    updatedLabel: "updated",
    updated: "[AUG 2026]",
    githubUrl: "https://github.com/nubstr3/atlas-fitness",
  },
];

export const QUEUED_PROJECTS: ProjectEntry[] = [];

export const PUBLICATIONS: PublicationEntry[] = [
  {
    title: "A Robust Hybrid IoT Framework for Post-Disaster Water Leakage Detection under Uncertain Sensing Conditions",
    venue: "IEEE PIMRC 2026",
    authors: "Co-author — Duaa Zuhair Al-Hamid et al.",
    summary: "A modular IoT framework for detecting leaks in water distribution networks after disasters like floods and earthquakes, pairing rule-based logic with unsupervised anomaly detection to stay accurate despite the sensor noise and missing data disasters cause.",
    url: "https://ieeexplore.ieee.org/document/11711437",
  },
];