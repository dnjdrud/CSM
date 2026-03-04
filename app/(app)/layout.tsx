/**
 * Authenticated app route group. Root layout (app/layout.tsx) already provides
 * HeaderWrapper and main grid; this layout just passes children through so
 * /feed, /community, /profile, /me, /post, /notifications, /search, /topics, /write share the same chrome.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
