/**
 * Daily Prayer thread template. Used by admin to create and pin today's prayer post.
 */

/** Format date as short English label, e.g. "Mar 3". */
export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export interface BuildDailyPrayerPostInput {
  date?: Date;
}

export interface BuildDailyPrayerPostResult {
  title: string;
  content: string;
  category: "PRAYER";
  visibility: "MEMBERS";
  tags: string[];
}

/** Formatted date for Daily Prayer title, e.g. "March 3, 2025". */
export function formatDailyPrayerDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Build post payload for today's Daily Prayer thread.
 * Content is calm, short, English community tone. Tags include exactly ["daily-prayer"].
 */
export function buildDailyPrayerPost(input: BuildDailyPrayerPostInput = {}): BuildDailyPrayerPostResult {
  const date = input.date ?? new Date();
  const formattedDate = formatDailyPrayerDate(date);
  const title = `Daily Prayer – ${formattedDate}`;

  const content = `Take a quiet moment today.
Share your prayer in the comments.
Let us carry one another.`;

  return {
    title,
    content,
    category: "PRAYER",
    visibility: "MEMBERS",
    tags: ["daily-prayer"],
  };
}
