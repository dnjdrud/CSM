"use client";

import Link from "next/link";

export type ProfileTab = "posts" | "notes" | "testimonies";

const TABS: { value: ProfileTab; label: string; href: (id: string) => string }[] = [
  { value: "posts", label: "Posts", href: (id) => `/profile/${id}` },
  { value: "notes", label: "Notes", href: (id) => `/profile/${id}/notes` },
  { value: "testimonies", label: "Testimonies", href: (id) => `/profile/${id}/testimonies` },
];

type Props = {
  profileId: string;
  activeTab: ProfileTab;
};

export function ProfileTabs({ profileId, activeTab }: Props) {
  return (
    <nav className="flex border-b border-gray-200 mt-8" aria-label="Profile sections">
      {TABS.map(({ value, label, href }) => (
        <Link
          key={value}
          href={href(profileId)}
          className={`px-4 py-3 text-[14px] font-medium border-b-2 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded-t ${
            activeTab === value
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
