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
        <section>
          <h2 className="font-medium text-theme-text mb-1">How to use Cellah</h2>
          <p className="leading-relaxed">
            Share prayers, reflections, and quiet updates. Respond with care. No algorithms — what you see is from people you follow or the whole community.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-theme-text mb-1">Community principles</h2>
          <p className="leading-relaxed">
            Respect, confidentiality, and mutual support. This is a space for reflection and connection, not debate or promotion.
          </p>
        </section>
      </div>
    </aside>
  );
}
