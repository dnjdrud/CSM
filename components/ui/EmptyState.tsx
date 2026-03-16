/**
 * Design system: EmptyState
 * Used when lists are empty (feed, notes, notifications, search).
 * Typography hierarchy, consistent spacing, CTA from tokens.
 */
import Link from "next/link";
import * as React from "react";
import { RADIUS, PADDING, FOCUS_RING_PRIMARY, TRANSITION } from "@/lib/design/tokens";

type Props = {
  title: string;
  description: string;
  action?: { label: string; href: string };
  /** Optional icon (emoji or ReactNode) above title */
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, icon, className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border border-theme-border bg-theme-surface px-6 py-12 text-center sm:px-8 sm:py-14 ${className}`}
    >
      {icon && (
        <div className="mb-4 flex justify-center text-2xl text-theme-muted [&>svg]:h-10 [&>svg]:w-10" aria-hidden>
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold tracking-tight text-theme-text">{title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-theme-muted max-w-sm mx-auto">{description}</p>
      {action && (
        <p className="mt-6">
          <Link
            href={action.href}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-button bg-theme-primary px-5 py-2.5 text-sm font-semibold text-white ${TRANSITION} hover:bg-theme-primary-2 active:scale-[0.98] ${FOCUS_RING_PRIMARY}`}
          >
            {action.label}
          </Link>
        </p>
      )}
    </div>
  );
}
