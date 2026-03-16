/**
 * Design system: Input
 * Single-line text input with hover / focus / disabled states.
 * Uses tokens: RADIUS.input, BORDER, BG, TRANSITION, focus ring.
 */
"use client";

import * as React from "react";
import { BORDER } from "@/lib/design/tokens";

const inputBase = [
  "block w-full rounded-input border bg-theme-surface text-theme-text placeholder:text-theme-muted",
  BORDER.default,
  "px-3 py-2.5 text-[15px] leading-normal",
  "hover:border-theme-border-2",
  "focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20 focus:ring-offset-0",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-theme-surface-2",
  "transition-colors duration-150",
].join(" ");

export type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  error?: boolean;
  inputClassName?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className = "", inputClassName = "", error, ...props }, ref) {
    return (
      <div className={className}>
        <input
          ref={ref}
          className={[
            inputBase,
            error && "border-theme-danger focus:border-theme-danger focus:ring-theme-danger/20",
            inputClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={error ?? undefined}
          {...props}
        />
      </div>
    );
  }
);

export default Input;
