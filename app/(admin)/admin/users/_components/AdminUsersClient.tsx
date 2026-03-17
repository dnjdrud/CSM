"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { AdminUserRow } from "@/lib/data/adminRepository";
import { ROLE_DISPLAY, type UserRole } from "@/lib/domain/types";
import { Card, CardContent } from "@/components/ui/Card";
import { DangerZoneConfirm } from "../../_components/DangerZoneConfirm";
import {
  blockUserAction,
  unblockUserAction,
  muteUserAction,
  unmuteUserAction,
  changeUserRoleAction,
} from "../actions";

const ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN", "ADMIN"];

export function AdminUsersClient({
  users,
  initialQuery,
}: {
  users: AdminUserRow[];
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    router.push(`/admin/users?${params.toString()}`);
  }

  return (
    <>
      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, bio, affiliation"
          className="rounded border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text placeholder:text-theme-subtle focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
        />
        <button
          type="submit"
          className="rounded-lg bg-theme-primary px-4 py-2 text-sm font-semibold text-black hover:brightness-110"
        >
          Search
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {users.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No users found.</p>
      ) : (
        <Card className="mt-8">
          <CardContent>
          <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="text-left py-2 pr-4 font-medium text-theme-text">Name</th>
                <th className="text-left py-2 pr-4 font-medium text-theme-text">Role</th>
                <th className="text-left py-2 pr-4 font-medium text-theme-text">Status</th>
                <th className="text-left py-2 font-medium text-theme-text">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4">
                    <Link href={`/profile/${u.id}`} className="text-theme-text font-medium hover:underline">
                      {u.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-theme-muted">{ROLE_DISPLAY[u.role]}</td>
                  <td className="py-3 pr-4 text-theme-muted">
                    {u.blockedByAdmin && <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">Blocked</span>}
                    {u.mutedByAdmin && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Muted</span>}
                    {!u.blockedByAdmin && !u.mutedByAdmin && "—"}
                  </td>
                  <td className="py-3">
                    <UserRowActions
                      user={u}
                      onError={(msg) => setError(msg)}
                      onSuccess={() => setError(null)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function UserRowActions({
  user,
  onError,
  onSuccess,
}: {
  user: AdminUserRow;
  onError: (msg: string) => void;
  onSuccess: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleBlock() {
    setPending(true);
    onSuccess();
    const res = await blockUserAction(user.id);
    setPending(false);
    if (!res.ok) onError(res.error ?? "Failed");
  }

  async function handleUnblock() {
    setPending(true);
    onSuccess();
    const res = await unblockUserAction(user.id);
    setPending(false);
    if (!res.ok) onError(res.error ?? "Failed");
  }

  async function handleMute() {
    setPending(true);
    onSuccess();
    const res = await muteUserAction(user.id);
    setPending(false);
    if (!res.ok) onError(res.error ?? "Failed");
  }

  async function handleUnmute() {
    setPending(true);
    onSuccess();
    const res = await unmuteUserAction(user.id);
    setPending(false);
    if (!res.ok) onError(res.error ?? "Failed");
  }

  async function handleChangeRole(role: UserRole) {
    setPending(true);
    onSuccess();
    const res = await changeUserRoleAction(user.id, role);
    setPending(false);
    if (!res.ok) onError(res.error ?? "Failed");
  }

  const safeName = user.name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20) || "user";
  const blockConfirmText = `block ${safeName}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {user.blockedByAdmin ? (
        <DangerZoneConfirm
          title="Unblock user"
          description="This user is currently blocked by you."
          confirmText={`unblock ${safeName}`}
          onConfirm={handleUnblock}
          buttonLabel="Unblock"
          disabled={pending}
        />
      ) : (
        <DangerZoneConfirm
          title="Block user"
          description={`Block ${user.name}.`}
          confirmText={blockConfirmText}
          onConfirm={handleBlock}
          buttonLabel="Block"
          disabled={pending}
        />
      )}
      {user.mutedByAdmin ? (
        <button
          type="button"
          onClick={handleUnmute}
          disabled={pending}
          className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
        >
          Unmute
        </button>
      ) : (
        <button
          type="button"
          onClick={handleMute}
          disabled={pending}
          className="rounded border border-theme-border bg-theme-surface-2 px-2 py-1 text-xs font-medium text-theme-text hover:bg-theme-surface-2 disabled:opacity-50"
        >
          Mute
        </button>
      )}
      <RoleChangeDropdown currentRole={user.role} userName={user.name} onChangeRole={handleChangeRole} disabled={pending} />
    </div>
  );
}

function RoleChangeDropdown({
  currentRole,
  userName,
  onChangeRole,
  disabled,
}: {
  currentRole: UserRole;
  userName: string;
  onChangeRole: (role: UserRole) => Promise<void>;
  disabled: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
        className="rounded border border-theme-border bg-theme-surface px-2 py-1 text-xs text-theme-text"
        disabled={disabled}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_DISPLAY[r]}
          </option>
        ))}
      </select>
      {selectedRole !== currentRole && (
        <DangerZoneConfirm
          title={`Change role to ${ROLE_DISPLAY[selectedRole]}`}
          description={`Set ${userName}'s role to ${selectedRole}.`}
          confirmText={selectedRole}
          onConfirm={() => onChangeRole(selectedRole)}
          buttonLabel="Change role"
          disabled={disabled}
        />
      )}
    </div>
  );
}
