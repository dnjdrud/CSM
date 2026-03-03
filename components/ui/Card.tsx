/**
 * Design system: Card
 * Uses lib/design/tokens (RADIUS.card, BORDER.default, PADDING.card).
 * Optional header/footer via CardHeader, CardContent, CardFooter.
 */
import * as React from "react";
import { RADIUS, BORDER, BG, PADDING, TRANSITION } from "@/lib/design/tokens";

export function Card({
  children,
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`${RADIUS.card} border ${BORDER.default} ${BG.surface} ${TRANSITION} hover:bg-gray-50/50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={`${PADDING.card} pb-0 ${className}`} {...props}>
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
    <div className={`${PADDING.card} ${className}`} {...props}>
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
    <div className={`${PADDING.card} pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}
