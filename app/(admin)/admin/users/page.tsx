import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/guard";
import { listUsers } from "@/lib/data/adminRepository";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { AdminUsersClient } from "./_components/AdminUsersClient";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const { userId: adminId } = await requireAdmin();
  const { q } = await searchParams;
  const users = await listUsers({ query: q, adminId });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        Users
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Search and manage users. Block, mute, or change role.
      </p>

      <Suspense fallback={<p className="mt-8 text-sm text-gray-500">Loading…</p>}>
        <AdminUsersClient
          users={users}
          initialQuery={q ?? ""}
        />
      </Suspense>
    </div>
  );
}
