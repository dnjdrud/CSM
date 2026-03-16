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
      <p className={isPlain ? "text-lg font-semibold text-theme-text tabular-nums" : "text-xl font-medium text-theme-text tabular-nums"}>{value}</p>
      <p className={isPlain ? "mt-0.5 text-[11px] font-medium text-theme-muted uppercase tracking-wider" : "mt-0.5 text-xs font-medium text-theme-muted uppercase tracking-wide"}>{label}</p>
    </>
  );

  const baseClass = isPlain
    ? "rounded-lg px-3 py-2 text-center"
    : "rounded-xl border border-theme-border bg-theme-surface-2/50 px-4 py-3 text-center transition-colors hover:bg-theme-surface-2";

  if (href) {
    return (
      <Link
        href={href}
        className={`block ${baseClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 ${className}`}
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
