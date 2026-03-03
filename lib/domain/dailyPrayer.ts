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

/**
 * Build post payload for today's Daily Prayer thread.
 * Content is calm, short, non-performative. Tags include exactly ["daily-prayer"].
 */
export function buildDailyPrayerPost(input: BuildDailyPrayerPostInput = {}): BuildDailyPrayerPostResult {
  const date = input.date ?? new Date();
  const title = `Daily Prayer — ${formatDateLabel(date)}`;

  const content = `Welcome to today's prayer thread.
Share a prayer request, a gratitude, or a name you'd like us to lift up.

• A gratitude from today
• Someone to intercede for
• A small step of faith you need`;

  return {
    title,
    content,
    category: "PRAYER",
    visibility: "MEMBERS",
    tags: ["daily-prayer"],
  };
}
