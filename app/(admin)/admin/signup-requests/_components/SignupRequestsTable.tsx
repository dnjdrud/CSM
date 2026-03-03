"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveSignupRequestAction, rejectSignupRequestAction } from "../actions";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import type { SignupRequest } from "@/lib/domain/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type Props = { requests: SignupRequest[] };

export function SignupRequestsTable({ requests }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(requestId: string) {
    setError(null);
    setPendingId(requestId);
    const result = await approveSignupRequestAction(requestId);
    setPendingId(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  async function handleReject(requestId: string) {
    setError(null);
    setPendingId(requestId);
    const note = rejectNote[requestId]?.trim() || undefined;
    const result = await rejectSignupRequestAction(requestId, note);
    setPendingId(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <>
      {error && (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Email</th>
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Name</th>
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Role</th>
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Church</th>
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Submitted</th>
            <th className="text-left py-2 font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-800">{r.email}</td>
              <td className="py-2 pr-4 text-gray-700">{r.name ?? "—"}</td>
              <td className="py-2 pr-4 text-gray-700">{ROLE_DISPLAY[r.role] ?? r.role}</td>
              <td className="py-2 pr-4 text-gray-700">{r.church ?? "—"}</td>
              <td className="py-2 pr-4 text-gray-600">{formatDate(r.createdAt)}</td>
              <td className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(r.id)}
                    disabled={pendingId !== null}
                    className="rounded-md bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {pendingId === r.id ? "Approving…" : "Approve"}
                  </button>
                  <span className="text-gray-400">|</span>
                  <input
                    type="text"
                    placeholder="Reject note (optional)"
                    value={rejectNote[r.id] ?? ""}
                    onChange={(e) => setRejectNote((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="w-40 rounded border border-gray-200 px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleReject(r.id)}
                    disabled={pendingId !== null}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {pendingId === r.id ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
