/**
 * Design system: Tabs
 * Presentational tab list + tab panels. Active indicator, hover/focus from tokens.
 */
"use client";

import * as React from "react";
import { FOCUS_RING } from "@/lib/design/tokens";

type TabsContextValue = {
  value: string;
  onChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsProps = {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  /** Optional label for tablist */
  "aria-label"?: string;
};

export function Tabs({
  value,
  onChange,
  children,
  className = "",
  "aria-label": ariaLabel,
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={`flex border-b border-theme-border ${className}`} role="tablist" aria-label={ariaLabel}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

type TabProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
};

export function Tab({ value, children, className = "", icon }: TabProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tab must be used within Tabs");
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.onChange(value)}
      className={[
        "inline-flex items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150",
        isActive
          ? "border-theme-primary text-theme-primary"
          : "border-transparent text-theme-muted hover:text-theme-text hover:border-theme-border",
        FOCUS_RING,
        "rounded-t",
        className,
      ].join(" ")}
    >
      {icon && <span aria-hidden className="text-base leading-none">{icon}</span>}
      {children}
    </button>
  );
}

type TabPanelProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

export function TabPanel({ value, children, className = "" }: TabPanelProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabPanel must be used within Tabs");
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
