/**
 * Relative time formatting utilities. No external library.
 */

/** English relative time. Used for notifications and English-locale UI. */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Korean relative time. Shared across feed components.
 * Outputs: "방금" / "N분" / "N시간" / "N일" / "M월 D일"
 */
export function relativeTimeKo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMs / 3600000);
  const d = Math.floor(diffMs / 86400000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분`;
  if (h < 24) return `${h}시간`;
  if (d < 7) return `${d}일`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

/**
 * Locale-aware relative time. Used by PostCard which renders in both ko/en.
 */
export function relativeTimeLocale(iso: string, locale: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (locale === "en") {
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    if (h < 24) return `${h}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (m < 1) return "방금";
  if (m < 60) return `${m}분`;
  if (h < 24) return `${h}시간`;
  if (days < 7) return `${days}일`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
