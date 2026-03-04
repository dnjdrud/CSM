export default function CommunityLoading() {
  return (
    <div className="w-full flex flex-col min-h-0 flex-1 px-0 md:px-4 py-4 md:py-6">
      <div className="flex flex-col md:grid md:grid-cols-[360px_1fr] min-h-0 flex-1 w-full max-w-6xl mx-auto animate-pulse">
        <div className="h-64 md:h-[80vh] bg-theme-surface-2 rounded-md" />
        <div className="hidden md:block h-[80vh] bg-theme-surface-2 rounded-md ml-4" />
      </div>
    </div>
  );
}
