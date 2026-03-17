"use client";

import Link from "next/link";
import Image from "next/image";

/** Cellah′ wordmark with logo icon. */
export function CellahLogo({ className = "", showIcon = true }: { className?: string; showIcon?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-semibold tracking-tight text-theme-primary hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded ${className}`}
      aria-label="Cellah home"
    >
      {showIcon && (
        <Image
          src="/logo-icon.png"
          alt=""
          width={28}
          height={28}
          className="w-7 h-7 shrink-0 object-contain"
          aria-hidden
        />
      )}
      <span className="relative">
        Cellah
        <span className="absolute -top-0.5 -right-1.5 text-theme-accent font-normal" aria-hidden>′</span>
      </span>
    </Link>
  );
}
