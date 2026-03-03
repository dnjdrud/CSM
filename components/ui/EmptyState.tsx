/**
 * Design system: EmptyState
 * - Used when lists are empty (feed, notes, notifications, search). Calm, readable.
 * - Props: title, description, optional action (label + href). Body text: text-[15px] leading-7; title text-base.
 */
import Link from "next/link";
import * as React from "react";

type Props = {
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
};

export function EmptyState({ title, description, action, className = "" }: Props) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-gray-50/50 px-6 py-10 text-center ${className}`}>
      <h2 className="text-base font-medium text-gray-800">{title}</h2>
      <p className="mt-2 text-[15px] leading-7 text-gray-500">{description}</p>
      {action && (
        <p className="mt-4">
          <Link
            href={action.href}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-800 px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:opacity-90"
          >
            {action.label}
          </Link>
        </p>
      )}
    </div>
  );
}
