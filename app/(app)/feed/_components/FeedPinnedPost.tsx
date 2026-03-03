import type { PostWithAuthor } from "@/lib/domain/types";
import { isDailyPrayerTag } from "../_lib/dailyPrayer";
import { FeedPostCard } from "./FeedPostCard";

type Props = {
  pinnedPost: PostWithAuthor;
  currentUserId: string | null;
};

export function FeedPinnedPost({ pinnedPost, currentUserId }: Props) {
  const showDailyPrayerPrompt = isDailyPrayerTag(pinnedPost);
  return (
    <li key={pinnedPost.id}>
      {currentUserId && showDailyPrayerPrompt && (
        <p className="px-4 pt-3 pb-2 text-[13px] text-neutral-500">
          Today&apos;s Daily Prayer is pinned. Add a prayer in the comments below.
        </p>
      )}
      <FeedPostCard post={pinnedPost} pinned currentUserId={currentUserId} />
    </li>
  );
}
