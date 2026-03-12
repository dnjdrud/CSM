import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { securityHeaders } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // /cell/* → /cells/*
      { source: "/cell", destination: "/cells", permanent: true },
      { source: "/cell/:id", destination: "/cells/:id", permanent: true },
      { source: "/cell/join/:token", destination: "/cells/join/:token", permanent: true },
      // /cells/join/:token — already handled natively at /cells/join/[token]
      // /feed (no scope) → /home
      // Note: scope-based feed remains at /feed for backward compat
      // /profile/:id/edit → /settings/profile
      { source: "/profile/:id/edit", destination: "/settings/profile", permanent: false },
      // /me → /profile (redirect to settings)
      // Keep /me as My Space, don't redirect
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
