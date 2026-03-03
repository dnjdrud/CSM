import Link from "next/link";

/** Clickable pill linking to /topics/[tag]. Soft pill style — Cellah theme. */
export function TagPill({ tag }: { tag: string }) {
  const display = tag.charAt(0).toUpperCase() + tag.slice(1);
  return (
    <Link
      href={`/topics/${encodeURIComponent(tag)}`}
      className="inline-flex items-center rounded-full border border-theme-border bg-theme-surface-2 px-2.5 py-0.5 text-xs font-medium text-theme-text hover:bg-theme-surface hover:border-theme-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2"
    >
      {display}
    </Link>
  );
}
