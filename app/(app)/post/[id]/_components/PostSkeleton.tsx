/** Placeholder matching post detail layout. Tailwind only, calm and minimal. */
export function PostSkeleton() {
  return (
    <article className="px-4" aria-busy="true" aria-label="Loading post">
      <div className="py-4">
        <div className="h-4 w-28 rounded bg-theme-surface-2 animate-pulse" />
      </div>
      <header className="py-4 border-b border-theme-border flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            <div className="h-4 w-32 rounded bg-theme-surface-2 animate-pulse" />
            <span className="text-theme-border">·</span>
            <div className="h-3 w-16 rounded bg-theme-surface-2 animate-pulse" />
            <span className="text-theme-border">·</span>
            <div className="h-3 w-20 rounded bg-theme-surface-2 animate-pulse" />
          </div>
          <div className="mt-1.5 h-3 w-48 rounded bg-theme-surface-2 animate-pulse" />
        </div>
      </header>
      <div className="pt-4">
        <div className="h-5 max-w-xs rounded bg-theme-surface-2 animate-pulse" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full rounded bg-theme-surface-2 animate-pulse" />
          <div className="h-4 w-full rounded bg-theme-surface-2 animate-pulse" />
          <div className="h-4 w-full max-w-[90%] rounded bg-theme-surface-2 animate-pulse" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="h-5 w-14 rounded bg-theme-surface-2 animate-pulse" />
          <div className="h-5 w-20 rounded bg-theme-surface-2 animate-pulse" />
        </div>
      </div>
      <section className="mt-8 pt-6 border-t border-theme-border">
        <div className="h-3 w-20 rounded bg-theme-surface-2 animate-pulse uppercase tracking-wider mb-4" />
        <div className="mt-2 h-20 rounded bg-theme-surface-2/50 border border-theme-border animate-pulse" />
        <ul className="mt-6 space-y-4 list-none p-0">
          {[1, 2, 3].map((i) => (
            <li key={i} className="py-4 border-b border-theme-border last:border-b-0">
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <div className="h-4 w-24 rounded bg-theme-surface-2 animate-pulse" />
                <span className="text-theme-border">·</span>
                <div className="h-3 w-16 rounded bg-theme-surface-2 animate-pulse" />
              </div>
              <div className="mt-2 h-3 w-full max-w-md rounded bg-theme-surface-2 animate-pulse" />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
