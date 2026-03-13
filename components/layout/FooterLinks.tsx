"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export function FooterLinks() {
  const t = useT();
  return (
    <footer className="shrink-0 border-t border-theme-border py-4 px-4 text-center text-sm text-theme-muted">
      <Link href="/privacy" className="hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">{t.footer.privacy}</Link>
      {" · "}
      <Link href="/terms" className="hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">{t.footer.terms}</Link>
      {" · "}
      <Link href="/contact" className="hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">{t.footer.contact}</Link>
    </footer>
  );
}
