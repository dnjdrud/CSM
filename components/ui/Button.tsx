/**
 * Design system: Button
 * Uses lib/design/tokens (RADIUS.buttonSm, PADDING, DISABLED, FOCUS_RING).
 * Variants: primary, secondary, ghost, danger. Sizes: sm, md.
 */
"use client";

import * as React from "react";
import { RADIUS, PADDING, DISABLED, FOCUS_RING } from "@/lib/design/tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gray-800 text-white hover:bg-gray-700 focus-visible:ring-gray-700 " + DISABLED,
  secondary:
    "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus-visible:ring-gray-700 " + DISABLED,
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-700 " + DISABLED,
  danger:
    "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus-visible:ring-red-600 " + DISABLED,
};

const sizeStyles: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: `${PADDING.buttonMd} text-sm`,
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
      className={`inline-flex items-center justify-center font-medium ${RADIUS.buttonSm} ${FOCUS_RING} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin mr-1.5" aria-hidden />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
