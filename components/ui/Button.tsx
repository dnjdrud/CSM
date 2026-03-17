/**
 * Design system: Button
 * Variants: primary, secondary, ghost, danger. Sizes: sm, md.
 * Hover / active / focus states; spacing from tokens.
 */
"use client";

import * as React from "react";
import {
  RADIUS,
  PADDING,
  DISABLED,
  FOCUS_RING,
  FOCUS_RING_PRIMARY,
  BORDER,
  TRANSITION,
} from "@/lib/design/tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variantStyles: Record<Variant, string> = {
  primary: [
    "bg-theme-primary text-black font-semibold",
    "rounded-lg px-4 py-2 hover:brightness-110 active:scale-[0.98]",
    TRANSITION,
    DISABLED,
  ].join(" "),
  secondary: [
    "border border-theme-border text-theme-text rounded-lg px-4 py-2",
    "hover:bg-theme-surface-2",
    TRANSITION,
    DISABLED,
  ].join(" "),
  ghost: [
    "bg-transparent text-theme-muted border border-transparent",
    "hover:bg-theme-surface-2 hover:text-theme-text",
    "active:bg-theme-surface-3",
    TRANSITION,
    DISABLED,
  ].join(" "),
  danger: [
    "bg-theme-danger-bg text-theme-danger border border-theme-danger/30",
    "hover:bg-theme-danger/10 active:bg-theme-danger/15",
    TRANSITION,
    DISABLED,
  ].join(" "),
};

const focusStyles: Record<Variant, string> = {
  primary: FOCUS_RING_PRIMARY,
  secondary: FOCUS_RING,
  ghost: FOCUS_RING,
  danger: FOCUS_RING.replace("ring-theme-accent", "ring-theme-danger"),
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 min-h-0",
  md: "px-4 py-2 text-sm gap-2 min-h-[44px]",
};

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-medium rounded-button",
        variantStyles[variant],
        focusStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden
          />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
