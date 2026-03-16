/**
 * Design system: Skeleton
 * Loading placeholders. Theme colors, consistent radius, pulse animation.
 */
import * as React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`animate-pulse rounded-md bg-theme-surface-2 ${className}`}
      aria-hidden
      {...props}
    />
  );
}

/** Single line of text placeholder. Meta: h-3; body: h-4. */
export function SkeletonText({ className = "", ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={`h-4 max-w-full ${className}`} {...props} />;
}

/** Block placeholder (card, image). Default h-24. */
export function SkeletonBlock({ className = "", ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={`h-24 ${className}`} {...props} />;
}
