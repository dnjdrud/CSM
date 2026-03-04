export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse" aria-hidden>
      <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-4">
            <div className="h-4 w-3/4 bg-gray-100 rounded mb-3" />
            <div className="h-3 w-full bg-gray-100 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
