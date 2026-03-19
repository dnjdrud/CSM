/**
 * Design system: Card
 * Container with optional CardHeader, CardContent, CardFooter.
 * Hover lift (shadow), focus-within for accessibility; spacing from tokens.
 */
import * as React from "react";
import { RADIUS, BORDER, SHADOW, PADDING, TRANSITION_ALL } from "@/lib/design/tokens";

const cardBase = [
  "rounded-xl border border-theme-border bg-theme-surface",
  TRANSITION_ALL,
  "focus-within:ring-2 focus-within:ring-theme-primary/10 focus-within:ring-offset-2 focus-within:border-theme-border-2",
].join(" ");

export function Card({
  children,
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={`${cardBase} ${className}`} {...props}>
      {children}
    </div>
  );
}

const headerPadding = "px-5 pt-5 pb-0";
const contentPadding = "p-5";
const footerPadding = "px-5 pb-5 pt-0";

export function CardHeader({
  children,
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={`${headerPadding} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={`${contentPadding} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={`${footerPadding} ${className}`} {...props}>
      {children}
    </div>
  );
}
