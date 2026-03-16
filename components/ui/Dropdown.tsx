/**
 * Design system: Dropdown
 * Trigger + menu panel; hover/active/focus on items; spacing from tokens.
 */
"use client";

import * as React from "react";
import { RADIUS, BORDER, SHADOW, PADDING, FOCUS_RING, TRANSITION } from "@/lib/design/tokens";

type DropdownProps = {
  /** Trigger element; receives toggle handler so you can pass onClick to your button */
  trigger: React.ReactNode | ((props: { onToggle: () => void }) => React.ReactNode);
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "left" | "right";
  className?: string;
};

export function Dropdown({
  trigger,
  children,
  open,
  onOpenChange,
  align = "right",
  className = "",
}: DropdownProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onToggle = () => onOpenChange(!open);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const triggerNode =
    typeof trigger === "function"
      ? trigger({ onToggle })
      : React.isValidElement(trigger)
        ? React.cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, { onClick: onToggle })
        : trigger;

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      {triggerNode}
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => onOpenChange(false)}
          />
          <div
            className={`absolute z-20 mt-1 min-w-[8rem] rounded-lg border bg-theme-surface py-1 ${SHADOW.md} ${BORDER.default} ${align === "right" ? "right-0" : "left-0"}`}
            role="menu"
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

const itemBase = [
  "block w-full text-left px-3 py-2.5 text-sm text-theme-text",
  "hover:bg-theme-surface-2 active:bg-theme-surface-3",
  TRANSITION,
  FOCUS_RING,
  "rounded-md mx-1 my-0.5",
].join(" ");

export function DropdownItem({
  children,
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`${itemBase} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownItemDanger({
  children,
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`${itemBase} text-theme-danger hover:bg-theme-danger-bg active:bg-theme-danger-bg ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
