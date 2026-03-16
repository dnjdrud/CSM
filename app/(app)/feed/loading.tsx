export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse" aria-hidden>
      <div className="h-8 w-48 bg-theme-surface-2 rounded mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-theme-border p-4">
            <div className="h-4 w-3/4 bg-theme-surface-2 rounded mb-3" />
            <div className="h-3 w-full bg-theme-surface-2 rounded mb-2" />
            <div className="h-3 w-1/2 bg-theme-surface-2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
