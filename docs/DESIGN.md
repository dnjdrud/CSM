# CSM Design System

Lightweight, living system. Consistency without heavy abstraction.

---

## Core principles

1. **Quiet** — No flashy animations, no dopamine mechanics. Feedback is subtle and reverent.
2. **Slow** — Content is read, not scanned. Spacing and typography support reflection.
3. **Safe** — Psychologically and spiritually. No performative pressure; sanctuary, not stage.

---

## What NOT to do

- **No trends** — Avoid “for you” feeds, viral cues, or engagement metrics.
- **No gamification** — No points, streaks, badges for usage, or celebration effects.
- **No clutter** — One primary label per context. No stacking many badges or CTAs.
- **No urgency language** — No “Don’t miss out,” “Limited time,” or FOMO copy.
- **No confetti, vibration, or sound** — Interactions are calm and acknowledged, not rewarded.

---

## Tokens

Defined in `lib/design/tokens.ts` and optionally in `tailwind.config.ts`. Use the same Tailwind classes across components so the system stays consistent.

| Role | Tailwind / token |
|------|------------------|
| **Backgrounds** | `bg-white`, `bg-gray-50`, `bg-gray-50/50` |
| **Borders** | `border-gray-200` (default), `border-gray-100` (subtle) |
| **Text primary** | `text-gray-900`, `text-gray-800` |
| **Text muted** | `text-neutral-500`, `text-neutral-400` |
| **Card radius** | `rounded-xl` |
| **Button/input radius** | `rounded-lg` or `rounded-md` |
| **Card padding** | `p-4` (or `py-3 px-3 sm:px-4` for tight cards) |
| **Section body spacing** | `mt-3` |
| **Body text** | `text-[15px] leading-7` |
| **Meta / labels** | `text-[12px]`, `text-[11px]` for captions |
| **Section title** | `text-sm font-medium uppercase tracking-wider` |
| **Disabled** | `disabled:opacity-40 disabled:cursor-not-allowed` |
| **Focus ring** | `focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2` |

---

## Components

- **Card** — `Card`, `CardContent`, `CardHeader`, `CardFooter`. Uses `RADIUS.card`, `BORDER.default`, `PADDING.card`.
- **Section** — `Section`, `SectionHeader`, `SectionBody`. Section title uses `TYPOGRAPHY.sectionTitle`; body uses `PADDING.sectionBody`.
- **Button** — `Button` (ui). Uses `DISABLED`, `FOCUS_RING`, `RADIUS.buttonSm`, `PADDING.buttonMd` for md size.
- **Tabs** — Feed scope and My Space tabs use `PADDING.tab`, `TYPOGRAPHY.tab`, `BORDER.default`.

---

## Adding new UI

1. **Reuse first** — Use `Card`, `Section`, `Button` from `components/ui/` before building new patterns.
2. **Match tokens** — Use the same padding (e.g. `p-4` for cards), radius (`rounded-xl` for cards, `rounded-lg` for buttons), and font sizes (`text-[15px] leading-7` for body, `text-[12px]` for meta).
3. **Disabled state** — Buttons and controls: `disabled:opacity-40 disabled:cursor-not-allowed`.
4. **Tone** — Copy and micro-interactions should feel calm and intentional, not urgent or playful.
5. **Touch** — Interactive elements at least 44px height on mobile; use `min-h-[44px]` where needed.

---

## File reference

- **Tokens:** `lib/design/tokens.ts`
- **Tailwind:** `tailwind.config.ts` (semantic `design.*` colors/radius/fontSize in `theme.extend`)
- **UI primitives:** `components/ui/Card.tsx`, `Section.tsx`, `Button.tsx`, `Badge.tsx`, `EmptyState.tsx`, `StatCard.tsx`
