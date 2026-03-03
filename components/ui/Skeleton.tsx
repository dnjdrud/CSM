/**
 * Design system: Skeleton
 * - Generic skeleton blocks for loading states (feed, profile). animate-pulse, bg-gray-200, rounded.
 * - Section spacing: use consistent heights (e.g. h-4 for text lines, h-10 for buttons).
 */
import * as React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-100 ${className}`}
      aria-hidden
      {...props}
    />
  );
}

/** Single line of text placeholder. Meta line: h-3; body line: h-4. */
export function SkeletonText({ className = "", ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={`h-4 max-w-full ${className}`} {...props} />;
}

/** Block placeholder (card, image, etc.). Default h-24. */
export function SkeletonBlock({ className = "", ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={`h-24 ${className}`} {...props} />;
}
