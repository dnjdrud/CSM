import { TimelineContainer } from "@/components/TimelineContainer";
import { FeedSkeleton } from "./_components/FeedSkeleton";

export default function FeedLoading() {
  return (
    <TimelineContainer>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-md bg-gray-100 animate-pulse" aria-hidden />
          <div className="h-9 w-24 rounded-md bg-gray-100 animate-pulse" aria-hidden />
        </div>
      </div>
      <div className="border-b border-gray-200 p-4">
        <div className="h-16 w-full rounded-lg bg-gray-100 animate-pulse" aria-hidden />
      </div>
      <div className="space-y-0 py-4">
        <FeedSkeleton />
      </div>
      <p className="py-6 px-4 text-center border-t border-gray-200">
        <span className="inline-block h-4 w-40 rounded bg-gray-100 animate-pulse" aria-hidden />
      </p>
    </TimelineContainer>
  );
}
