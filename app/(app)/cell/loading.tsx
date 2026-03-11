export default function CellLoading() {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 animate-pulse" aria-hidden>
      <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-4">
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-1/4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
