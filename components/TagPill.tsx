import Link from "next/link";

/** Clickable pill linking to /topics/[tag]. Tag should be normalized (lowercase). */
export function TagPill({ tag }: { tag: string }) {
  const display = tag.charAt(0).toUpperCase() + tag.slice(1);
  return (
    <Link
      href={`/topics/${encodeURIComponent(tag)}`}
      className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
    >
      {display}
    </Link>
  );
}
