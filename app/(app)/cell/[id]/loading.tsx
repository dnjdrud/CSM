export default function CellChatLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse" aria-hidden>
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="h-5 w-40 bg-gray-200 rounded mb-1" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
      <div className="flex-1 px-4 py-4 space-y-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "justify-end" : ""}`}>
            {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />}
            <div className="h-8 rounded-xl bg-gray-100" style={{ width: `${40 + (i * 13) % 40}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
