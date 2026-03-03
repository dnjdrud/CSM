/**
 * Wraps timeline content (feed, post detail) with standard width and padding.
 * Single scrolling column. Use across Feed, Post detail, Profile, My Space.
 * Respects iOS safe area (bottom) so content is not hidden by home indicator.
 */
export function TimelineContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[680px] min-h-screen border-x border-gray-200 bg-white px-3 sm:px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
