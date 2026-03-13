/**
 * Wraps timeline content (feed, post detail) with standard width and padding.
 * Single scrolling column. Use across Feed, Post detail, Profile, My Space.
 * Respects iOS safe area (bottom) so content is not hidden by home indicator.
 */
export function TimelineContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl min-h-screen border-x border-theme-border bg-theme-surface pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
