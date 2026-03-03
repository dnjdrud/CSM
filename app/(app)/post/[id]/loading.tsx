import { TimelineContainer } from "@/components/TimelineContainer";
import { PostSkeleton } from "./_components/PostSkeleton";

export default function PostLoading() {
  return (
    <TimelineContainer>
      <PostSkeleton />
    </TimelineContainer>
  );
}
