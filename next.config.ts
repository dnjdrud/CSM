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
      // /profile/:id/prayers (removed tab) → /profile/:id
      { source: "/profile/:id/prayers", destination: "/profile/:id", permanent: false },
      // /notifications/settings (moved) → /settings/notifications
      { source: "/notifications/settings", destination: "/settings/notifications", permanent: false },
      // /cells/:id/prayer (removed tab) → /cells/:id
      { source: "/cells/:id/prayer", destination: "/cells/:id", permanent: false },
      // /admin/invites and /admin/signups (removed pages) → /admin/signup-requests
      { source: "/admin/invites", destination: "/admin/signup-requests", permanent: false },
      { source: "/admin/signups", destination: "/admin/signup-requests", permanent: false },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
