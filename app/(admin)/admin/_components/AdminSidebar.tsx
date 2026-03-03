"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/signup-requests", label: "Signup requests" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit", label: "Audit Log" },
  { href: "/admin/system-logs", label: "System Logs" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 border-r border-gray-200 bg-gray-50 p-4" aria-label="Admin navigation">
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 ${
                isActive ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 pt-4 border-t border-gray-200">
        <Link
          href="/feed"
          className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          ← Back to app
        </Link>
      </div>
    </aside>
  );
}
