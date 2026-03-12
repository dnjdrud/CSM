/**
 * Cell topic board definitions — hardcoded for MVP.
 * Designed to be migrated to a `cell_topics` DB table later.
 *
 * To add a topic board: append an entry here.
 * The `tags` array is matched against post.tags for topic feed filtering.
 */

export type CellTopic = {
  /** URL-safe slug, used in /cells/topics/[slug] */
  slug: string;
  /** Display name */
  name: string;
  /** Short description shown on the card */
  description: string;
  /** Emoji icon representing the topic */
  icon: string;
  /** Tailwind color token for card accent (bg + text + border) */
  color: string;
  /** Post tags that belong to this topic feed */
  tags: string[];
  /** Hashtags shown on the card */
  hashtags: string[];
};

export const CELL_TOPICS: CellTopic[] = [
  {
    slug: "praise",
    name: "찬양",
    description: "찬양 나눔, 악보, 묵상 가사 공유",
    icon: "🎵",
    color: "purple",
    tags: ["찬양", "worship", "praise"],
    hashtags: ["#찬양", "#worship"],
  },
  {
    slug: "bible",
    name: "성경 통독",
    description: "말씀 통독 기록과 묵상 나눔",
    icon: "📖",
    color: "amber",
    tags: ["성경통독", "통독", "말씀", "QT"],
    hashtags: ["#통독", "#말씀묵상"],
  },
  {
    slug: "youth",
    name: "청년 공동체",
    description: "청년 신앙과 삶의 이야기",
    icon: "🙌",
    color: "blue",
    tags: ["청년", "youth", "청년부"],
    hashtags: ["#청년", "#신앙생활"],
  },
  {
    slug: "books",
    name: "기독교 독서",
    description: "신앙 서적 리뷰와 독서 모임",
    icon: "📚",
    color: "emerald",
    tags: ["독서", "책", "book", "서평"],
    hashtags: ["#기독교독서", "#서평"],
  },
  {
    slug: "work",
    name: "직장인 크리스천",
    description: "직장과 신앙 사이의 고민 나눔",
    icon: "💼",
    color: "sky",
    tags: ["직장", "work", "직장인", "소명"],
    hashtags: ["#직장인크리스천", "#소명"],
  },
  {
    slug: "dating",
    name: "연애·결혼",
    description: "기독교 연애와 결혼 준비 이야기",
    icon: "💌",
    color: "rose",
    tags: ["연애", "결혼", "dating", "marriage"],
    hashtags: ["#기독교연애", "#결혼준비"],
  },
  {
    slug: "design",
    name: "교회 디자인",
    description: "예배 공간, 미디어, 디자인 영감",
    icon: "🎨",
    color: "orange",
    tags: ["디자인", "design", "교회디자인", "미디어"],
    hashtags: ["#교회디자인", "#미디어"],
  },
  {
    slug: "parenting",
    name: "기독 부모",
    description: "자녀 신앙 교육과 가정 예배 나눔",
    icon: "👨‍👩‍👧",
    color: "teal",
    tags: ["자녀", "부모", "가정예배", "parenting"],
    hashtags: ["#기독부모", "#가정예배"],
  },
];

/** Find a topic by slug. Returns undefined if not found. */
export function findTopicBySlug(slug: string): CellTopic | undefined {
  return CELL_TOPICS.find((t) => t.slug === slug);
}

/**
 * Tailwind classes per color token.
 * Kept here so topics.ts is the single source of truth for styling.
 */
export const TOPIC_COLOR_CLASSES: Record<
  string,
  { border: string; bg: string; text: string; badge: string }
> = {
  purple:  { border: "border-purple-200",  bg: "bg-purple-50",  text: "text-purple-700",  badge: "bg-purple-100 text-purple-700" },
  amber:   { border: "border-amber-200",   bg: "bg-amber-50",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-700" },
  blue:    { border: "border-blue-200",    bg: "bg-blue-50",    text: "text-blue-700",    badge: "bg-blue-100 text-blue-700" },
  emerald: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  sky:     { border: "border-sky-200",     bg: "bg-sky-50",     text: "text-sky-700",     badge: "bg-sky-100 text-sky-700" },
  rose:    { border: "border-rose-200",    bg: "bg-rose-50",    text: "text-rose-700",    badge: "bg-rose-100 text-rose-700" },
  orange:  { border: "border-orange-200",  bg: "bg-orange-50",  text: "text-orange-700",  badge: "bg-orange-100 text-orange-700" },
  teal:    { border: "border-teal-200",    bg: "bg-teal-50",    text: "text-teal-700",    badge: "bg-teal-100 text-teal-700" },
};
