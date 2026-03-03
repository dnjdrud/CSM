/**
 * Design tokens — Tailwind class strings for consistency.
 * Use these in components or match manually; see docs/DESIGN.md.
 * Semantic naming; no new abstractions.
 */

/** Backgrounds: surface (cards, panels), muted (subtle areas), input (inputs) */
export const BG = {
  surface: "bg-white",
  surfaceMuted: "bg-gray-50",
  surfaceMutedSubtle: "bg-gray-50/50",
  input: "bg-white",
  inputMuted: "bg-gray-50/80",
} as const;

/** Text: primary (body/headings), secondary (meta), muted (hints) */
export const TEXT = {
  primary: "text-gray-900",
  body: "text-gray-800",
  secondary: "text-neutral-600",
  muted: "text-neutral-500",
  subdued: "text-neutral-400",
  /** Section titles, labels */
  label: "text-neutral-700",
  /** Small labels, captions */
  caption: "text-[11px] text-neutral-500",
  meta: "text-[12px] text-neutral-500",
} as const;

/** Borders: default (cards, dividers), subtle (inner separators) */
export const BORDER = {
  default: "border-gray-200",
  subtle: "border-gray-100",
} as const;

/** Spacing: use with p-*, gap-*, mt-*, etc. xs=1, sm=2, md=3, lg=4, xl=6 (Tailwind scale) */
export const SPACING = {
  xs: "1",
  sm: "2",
  md: "3",
  lg: "4",
  xl: "6",
} as const;

/** Padding presets (full class strings) */
export const PADDING = {
  card: "p-4",
  cardTight: "py-3 px-3 sm:px-4",
  sectionBody: "mt-3",
  buttonMd: "px-4 py-2",
  buttonLg: "px-5 py-2.5",
  tab: "px-4 py-3",
  input: "px-3 py-2",
  inputLg: "px-3 py-2.5",
} as const;

/** Border radius: card (cards, empty states), button (buttons, inputs), pill (badges) */
export const RADIUS = {
  card: "rounded-xl",
  panel: "rounded-lg",
  button: "rounded-lg",
  buttonSm: "rounded-md",
  input: "rounded-lg",
  inputSm: "rounded-md",
  pill: "rounded-md",
} as const;

/** Font size + line height: body (post/note content), meta (timestamps, labels), caption (tiny labels) */
export const TYPOGRAPHY = {
  body: "text-[15px] leading-7",
  bodySm: "text-[14px] leading-6",
  meta: "text-[12px]",
  caption: "text-[11px]",
  sectionTitle: "text-sm font-medium uppercase tracking-wider",
  /** Tab and nav labels */
  tab: "text-[15px] font-medium",
} as const;

/** Disabled state: use on buttons and controls */
export const DISABLED = "disabled:opacity-40 disabled:cursor-not-allowed" as const;

/** Focus ring: use for interactive elements */
export const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2" as const;

/** Transition for hover/active */
export const TRANSITION = "transition-colors duration-200" as const;
