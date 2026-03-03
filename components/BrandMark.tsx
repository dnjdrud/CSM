"use client";

/**
 * Honeycomb brand symbol: hex outline + small pause mark in center.
 * Cellah accent — minimal, used in header only.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="none"
    >
      <path
        d="M12 2l4 3.5v7l-4 3.5-4-3.5v-7L12 2z"
        stroke="var(--primary)"
        strokeWidth="1.4"
        fill="var(--surface-2)"
      />
      <path d="M10.2 9v6" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13.8 9v6" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
