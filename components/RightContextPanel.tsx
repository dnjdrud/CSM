/**
 * Optional right-hand context panel. Hidden on mobile.
 * Calm, static content — no Twitter copy.
 */
export function RightContextPanel() {
  return (
    <aside
      className="hidden lg:block w-[280px] shrink-0 py-6 px-4 border-l border-theme-border bg-theme-surface"
      aria-label="Community guidance"
    >
      <div className="sticky top-6 space-y-6 text-sm text-theme-muted">
      </div>
    </aside>
  );
}
