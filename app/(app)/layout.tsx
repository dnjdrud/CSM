import { SessionRefresh } from "./_components/SessionRefresh";

/**
 * Authenticated app route group. Root layout (app/layout.tsx) already provides
 * HeaderWrapper and main grid; this layout just passes children through so
 * /feed, /community, /profile, /me, /post, /notifications, /search, /topics, /write share the same chrome.
 * force-dynamic so RSC always runs with current request (avoids stale prefetched payload without session).
 * SessionRefresh: on load, checks session via API (cookies sent) and router.refresh() so RSC sees session.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionRefresh />
      {children}
    </>
  );
}
