/**
 * Design system: Badge
 * - Variants: default, muted, testimony, daily-prayer. Used for role, category, pinned labels.
 * - Typography: meta text size (text-xs). Spacing: px-1.5 py-0.5, rounded-md.
 */
import * as React from "react";

type Variant = "default" | "muted" | "subtle" | "testimony" | "daily-prayer";

const variantStyles: Record<Variant, string> = {
  default: "bg-gray-800 text-white border border-transparent",
  muted: "bg-gray-100 text-gray-600 border border-gray-200",
  subtle: "bg-gray-100 text-gray-600 border border-gray-200",
  testimony: "bg-amber-50 text-amber-800 border border-amber-200",
  "daily-prayer": "bg-sky-50 text-sky-800 border border-sky-200",
};

export function Badge({
  children,
  variant = "default",
  className = "",
  ...props
}: React.ComponentProps<"span"> & { variant?: Variant }) {
  const style = variantStyles[variant === "subtle" ? "muted" : variant];
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${style} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
