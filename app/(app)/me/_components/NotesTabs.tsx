"use client";

import Link from "next/link";
import type { NoteType } from "@/lib/domain/types";
import { BORDER, BG, PADDING, TYPOGRAPHY, FOCUS_RING, TRANSITION } from "@/lib/design/tokens";

const TABS: { value: NoteType; label: string }[] = [
  { value: "PRAYER", label: "Prayer" },
  { value: "GRATITUDE", label: "Gratitude" },
  { value: "MEDITATION", label: "Meditation" },
];

type Props = {
  activeTab: NoteType;
};

const tabBase = `min-h-[44px] inline-flex items-center ${PADDING.tab} ${TYPOGRAPHY.tab} border-b-2 -mb-px rounded-t ${TRANSITION} ${FOCUS_RING} active:bg-gray-100`;

export function NotesTabs({ activeTab }: Props) {
  return (
    <nav
      className={`sticky top-0 z-10 flex border-b ${BORDER.default} ${BG.surface}`}
      aria-label="Note types"
    >
      {TABS.map(({ value, label }) => (
        <Link
          key={value}
          href={value === "PRAYER" ? "/me" : `/me?tab=${value.toLowerCase()}`}
          className={`${tabBase} transition-[color,border-color] duration-200 ${
            activeTab === value
              ? "border-theme-primary text-theme-text"
              : "border-transparent text-theme-muted hover:text-theme-text hover:border-theme-border"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
