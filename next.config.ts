import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gives every deployment its own asset URLs (?dpl=...), so a CDN or browser can't keep serving a
  // previous deployment's file at the same /_next/static path.
  deploymentId: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || undefined,
};

export default nextConfig;