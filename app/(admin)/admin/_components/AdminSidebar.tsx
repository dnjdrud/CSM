"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/signups", label: "Signups" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit", label: "Audit Log" },
  { href: "/admin/system-logs", label: "System Logs" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 border-r border-theme-border bg-theme-surface-2 p-4" aria-label="Admin navigation">
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 ${
                isActive ? "bg-theme-primary text-white" : "text-theme-text hover:bg-theme-surface"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 pt-4 border-t border-theme-border">
        <Link
          href="/feed"
          className="text-sm text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded"
        >
          ← Back to app
        </Link>
      </div>
    </aside>
  );
}
