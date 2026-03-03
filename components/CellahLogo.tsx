"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

/** Cellah′ wordmark: deep teal, clean sans, apostrophe flourish after "h". */
export function CellahLogo({ className = "", showIcon = false }: { className?: string; showIcon?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-semibold tracking-tight text-theme-primary hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded ${className}`}
      aria-label="Cellah home"
    >
      {showIcon && <BrandMark className="w-6 h-6 shrink-0" />}
      <span className="relative">
        Cellah
        <span className="absolute -top-0.5 -right-1.5 text-theme-accent font-normal" aria-hidden>′</span>
      </span>
    </Link>
  );
}
