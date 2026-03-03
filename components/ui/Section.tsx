/**
 * Design system: Section
 * Uses lib/design/tokens (BORDER, TYPOGRAPHY, PADDING.sectionBody).
 */
import * as React from "react";
import { BORDER, TYPOGRAPHY, PADDING, TEXT } from "@/lib/design/tokens";

export function Section({
  children,
  className = "",
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section className={`border-t ${BORDER.default} first:border-t-0 first:pt-0 ${className}`} {...props}>
      {children}
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionSlot?: React.ReactNode;
  id?: string;
};

export function SectionHeader({ title, subtitle, actionSlot, id }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2 pt-6 first:pt-0">
      <div>
        <h2 id={id} className={`${TYPOGRAPHY.sectionTitle} ${TEXT.label}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-0.5 text-xs ${TEXT.muted}`}>{subtitle}</p>
        )}
      </div>
      {actionSlot && <div className="mt-1 sm:mt-0 shrink-0">{actionSlot}</div>}
    </div>
  );
}

export function SectionBody({
  children,
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={`${PADDING.sectionBody} ${className}`} {...props}>
      {children}
    </div>
  );
}
