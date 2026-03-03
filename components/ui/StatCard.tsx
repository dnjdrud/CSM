import * as React from "react";
import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string | number;
  href?: string;
  className?: string;
  variant?: "default" | "plain";
};

export function StatCard({ label, value, href, className = "", variant = "default" }: StatCardProps) {
  const isPlain = variant === "plain";
  const content = (
    <>
      <p className={isPlain ? "text-lg font-semibold text-gray-900 tabular-nums" : "text-xl font-medium text-gray-900 tabular-nums"}>{value}</p>
      <p className={isPlain ? "mt-0.5 text-[11px] font-medium text-neutral-400 uppercase tracking-wider" : "mt-0.5 text-xs font-medium text-neutral-500 uppercase tracking-wide"}>{label}</p>
    </>
  );

  const baseClass = isPlain
    ? "rounded-lg px-3 py-2 text-center"
    : "rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-center transition-colors hover:bg-gray-50";

  if (href) {
    return (
      <Link
        href={href}
        className={`block ${baseClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 ${className}`}
        aria-label={`${label}: ${value}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`${baseClass} ${className}`} aria-label={`${label}: ${value}`}>
      {content}
    </div>
  );
}
