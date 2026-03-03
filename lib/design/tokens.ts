/**
 * Design tokens — Tailwind class strings for Cellah theme.
 * Uses theme.* (CSS variables). Semantic naming.
 */

/** Backgrounds */
export const BG = {
  surface: "bg-theme-surface",
  surfaceMuted: "bg-theme-bg",
  surfaceMutedSubtle: "bg-theme-surface-2",
  input: "bg-theme-surface",
  inputMuted: "bg-theme-surface-2",
} as const;

/** Text */
export const TEXT = {
  primary: "text-theme-text",
  body: "text-theme-text",
  secondary: "text-theme-muted",
  muted: "text-theme-muted",
  subdued: "text-theme-muted",
  label: "text-theme-text",
  caption: "text-[11px] text-theme-muted",
  meta: "text-[12px] text-theme-muted",
} as const;

/** Borders */
export const BORDER = {
  default: "border-theme-border",
  subtle: "border-theme-border/70",
} as const;

export const SPACING = { xs: "1", sm: "2", md: "3", lg: "4", xl: "6" } as const;

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

/** Cards: rounded-2xl, soft border */
export const RADIUS = {
  card: "rounded-2xl",
  panel: "rounded-xl",
  button: "rounded-lg",
  buttonSm: "rounded-md",
  input: "rounded-lg",
  inputSm: "rounded-md",
  pill: "rounded-full",
} as const;

export const TYPOGRAPHY = {
  body: "text-[15px] leading-7",
  bodySm: "text-[14px] leading-6",
  meta: "text-[12px]",
  caption: "text-[11px]",
  sectionTitle: "text-sm font-medium uppercase tracking-wider",
  tab: "text-[15px] font-medium",
} as const;

export const DISABLED = "disabled:opacity-40 disabled:cursor-not-allowed" as const;

export const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2" as const;

export const TRANSITION = "transition-colors duration-200" as const;
