/**
 * Cellah Design System v2 — Semantic design tokens
 * All values map to Tailwind classes (CSS variable–based colors).
 * Import and compose these in components for UI consistency.
 */

/* ── Backgrounds ─────────────────────────────── */
export const BG = {
  page:          "bg-theme-bg",
  surface:       "bg-theme-surface",
  surfaceMuted:  "bg-theme-bg",            // alias kept for compat
  surfaceMutedSubtle: "bg-theme-surface-2", // alias kept for compat
  surfaceSubtle: "bg-theme-surface-2",
  surfaceActive: "bg-theme-surface-3",
  input:         "bg-theme-surface",
  inputMuted:    "bg-theme-surface-2",
  accentTint:    "bg-theme-accent-bg",
  dangerTint:    "bg-theme-danger-bg",
  successTint:   "bg-theme-success-bg",
  warningTint:   "bg-theme-warning-bg",
} as const;

/* ── Text ─────────────────────────────────────── */
export const TEXT = {
  primary:      "text-theme-text",
  body:         "text-theme-text",       // alias kept for compat
  secondary:    "text-theme-text-2",
  muted:        "text-theme-muted",
  subdued:      "text-theme-muted",      // alias kept for compat
  label:        "text-theme-text",       // alias kept for compat
  accent:       "text-theme-accent",
  brand:        "text-theme-primary",
  danger:       "text-theme-danger",
  success:      "text-theme-success",
  // Composed
  caption:      "text-caption text-theme-muted",
  meta:         "text-meta text-theme-muted",
  sectionTitle: "text-caption font-semibold text-theme-muted uppercase tracking-caps",
  labelMd:      "text-sm font-medium text-theme-text",
  labelMuted:   "text-sm font-medium text-theme-muted",
} as const;

/* ── Borders ──────────────────────────────────── */
export const BORDER = {
  default: "border-theme-border",
  subtle:  "border-theme-border/60",
  strong:  "border-theme-border-2",
  accent:  "border-theme-accent",
  danger:  "border-theme-danger",
} as const;

/* ── Border radius ────────────────────────────── */
export const RADIUS = {
  sm:       "rounded-sm",     // 6px  — small badges
  md:       "rounded-md",     // 10px — buttons, inputs
  lg:       "rounded-lg",     // 14px — panels
  xl:       "rounded-xl",     // 18px — cards
  "2xl":    "rounded-2xl",    // 24px — modals
  card:     "rounded-card",   // 18px semantic
  panel:    "rounded-panel",  // 14px semantic
  button:   "rounded-button", // 10px semantic
  buttonSm: "rounded-sm",     // alias kept for compat
  input:    "rounded-input",  // 10px semantic
  inputSm:  "rounded-sm",     // alias kept for compat
  pill:     "rounded-pill",   // 9999px
} as const;

/* ── Shadows ──────────────────────────────────── */
export const SHADOW = {
  xs:        "shadow-xs",
  sm:        "shadow-sm",
  soft:      "shadow-soft",         // default — replaces old "soft"
  md:        "shadow-md",
  lg:        "shadow-lg",
  card:      "shadow-card",
  cardHover: "shadow-card-hover",
} as const;

/* ── Padding ──────────────────────────────────── */
export const PADDING = {
  card:      "p-5",
  cardSm:    "p-4",
  cardTight: "py-3 px-4",
  sectionBody: "mt-3",              // alias kept for compat
  buttonSm:  "px-3 py-1.5",
  buttonMd:  "px-4 py-2",
  buttonLg:  "px-5 py-2.5",
  buttonXl:  "px-6 py-3",
  tab:       "px-4 py-2.5",
  input:     "px-3 py-2",
  inputLg:   "px-3 py-2.5",        // alias kept for compat
} as const;

/* ── Spacing scale ────────────────────────────── */
export const SPACING = {
  xs:   "2",   // 8px
  sm:   "3",   // 12px
  md:   "4",   // 16px
  lg:   "6",   // 24px
  xl:   "8",   // 32px
  "2xl":"12",  // 48px
} as const;

/* ── Typography ───────────────────────────────── */
export const TYPOGRAPHY = {
  caption:      "text-caption",
  meta:         "text-meta",
  body:         "text-body leading-reading",
  bodySm:       "text-sm leading-relaxed",
  bodyMd:       "text-body-md leading-relaxed",
  heading:      "font-semibold tracking-tight",
  headingSm:    "text-lg font-semibold tracking-tight",
  headingMd:    "text-xl font-semibold tracking-tight",
  headingLg:    "text-2xl font-semibold tracking-tighter",
  sectionTitle: "text-caption font-semibold uppercase tracking-caps",
  tab:          "text-sm font-medium",
} as const;

/* ── Focus rings ──────────────────────────────── */
export const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2" as const;

export const FOCUS_RING_PRIMARY =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2" as const;

/* ── Transitions ──────────────────────────────── */
export const TRANSITION      = "transition-colors duration-[120ms]" as const;
export const TRANSITION_ALL  = "transition-all duration-[200ms]" as const;
export const TRANSITION_SLOW = "transition-all duration-[320ms]" as const;

/* ── Disabled ─────────────────────────────────── */
export const DISABLED =
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none" as const;

/* ─────────────────────────────────────────────────
   Composed Component Patterns
   Copy–paste these to build consistent components.
   ───────────────────────────────────────────────── */

/** Primary CTA button */
export const BTN_PRIMARY =
  `rounded-lg bg-theme-primary px-4 py-2 text-black font-semibold ${TRANSITION} hover:brightness-110 ${FOCUS_RING_PRIMARY} ${DISABLED}` as const;

/** Secondary outlined button */
export const BTN_SECONDARY =
  `rounded-lg border border-theme-border px-4 py-2 text-theme-text font-medium ${TRANSITION} hover:bg-theme-surface-2 ${FOCUS_RING} ${DISABLED}` as const;

/** Ghost / icon button */
export const BTN_GHOST =
  `${RADIUS.md} px-3 py-2 text-sm font-medium text-theme-muted ${TRANSITION} hover:bg-theme-surface-2 hover:text-theme-text ${FOCUS_RING} ${DISABLED}` as const;

/** Danger destructive button */
export const BTN_DANGER =
  `${RADIUS.button} bg-theme-danger ${PADDING.buttonLg} text-sm font-semibold text-white ${TRANSITION} hover:opacity-90 ${FOCUS_RING} ${DISABLED}` as const;

/** Text / link button */
export const BTN_TEXT =
  `text-sm font-medium text-theme-primary underline-offset-2 hover:underline ${FOCUS_RING} ${DISABLED}` as const;

/** Standard text input */
export const INPUT =
  `block w-full ${RADIUS.input} border ${BORDER.default} ${BG.surface} px-3 py-2.5 text-body text-theme-text placeholder:text-theme-muted ${TRANSITION} hover:border-theme-border-2 focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20` as const;

/** Card container */
export const CARD =
  `${RADIUS.card} border ${BORDER.default} ${BG.surface} ${SHADOW.card} ${TRANSITION_ALL} hover:${SHADOW.cardHover}` as const;

/** Inline action button (reactions, comment, share row) */
export const BTN_ACTION =
  `flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 ${RADIUS.md} border border-transparent px-2 py-2 text-meta text-theme-muted ${TRANSITION} hover:bg-theme-surface-2 hover:text-theme-text active:bg-theme-surface-3 ${FOCUS_RING}` as const;
