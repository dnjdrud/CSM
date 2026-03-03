import type { PostWithAuthor } from "@/lib/domain/types";

/** True if post has the daily-prayer tag (case-insensitive). */
export function isDailyPrayerTag(post: PostWithAuthor): boolean {
  return Boolean(post.tags?.some((t) => t.toLowerCase() === "daily-prayer"));
}
