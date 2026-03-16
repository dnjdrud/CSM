/**
 * Design system: Badge
 * Variants: default, muted, testimony, daily-prayer. Spacing and radius from tokens.
 */
import * as React from "react";
import { RADIUS } from "@/lib/design/tokens";

type Variant = "default" | "muted" | "subtle" | "testimony" | "daily-prayer";

const variantStyles: Record<Variant, string> = {
  default:
    "bg-theme-primary text-white border border-transparent",
  muted:
    "bg-theme-surface-2 text-theme-muted border border-theme-border",
  subtle:
    "bg-theme-surface-2 text-theme-muted border border-theme-border",
  testimony:
    "bg-theme-accent/20 text-theme-primary border border-theme-accent/40",
  "daily-prayer":
    "bg-theme-surface-2 text-theme-primary border border-theme-border",
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
      className={[
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        "transition-colors duration-150",
        style,
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
