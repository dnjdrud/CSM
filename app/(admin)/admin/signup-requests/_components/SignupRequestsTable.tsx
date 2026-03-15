"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveSignupRequestAction, rejectSignupRequestAction } from "../actions";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import type { SignupRequest } from "@/lib/domain/types";
import { useToast } from "@/components/ui/Toast";

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

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "거절",
  COMPLETED: "완료",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-yellow-700 bg-yellow-50",
  APPROVED: "text-blue-700 bg-blue-50",
  REJECTED: "text-red-700 bg-red-50",
  COMPLETED: "text-green-700 bg-green-50",
};

type Props = { requests: SignupRequest[]; readOnly?: boolean };

export function SignupRequestsTable({ requests, readOnly = false }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(requestId: string) {
    setError(null);
    setPendingId(requestId);
    const result = await approveSignupRequestAction(requestId);
    setPendingId(null);
    if ("error" in result) {
      setError(result.error);
      toast.error(result.error);
    } else {
      if (result.emailError) {
        toast.error(`Approved, but email failed: ${result.emailError}`);
      } else {
        toast.show("계정이 생성되었습니다. 로그인 링크를 이메일로 발송했습니다.");
      }
      router.refresh();
    }
  }

  async function handleReject(requestId: string) {
    setError(null);
    setPendingId(requestId);
    const note = rejectNote[requestId]?.trim() || undefined;
    const result = await rejectSignupRequestAction(requestId, note);
    setPendingId(null);
    if ("error" in result) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.show("Request rejected.");
      router.refresh();
    }
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
            {!readOnly && <th className="text-left py-2 pr-4 font-medium text-gray-700">Reviewed</th>}
            <th className="text-left py-2 font-medium text-gray-700">
              {readOnly ? "Status" : "Actions"}
            </th>
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
              {!readOnly && (
                <td className="py-2 pr-4 text-gray-600">{formatDate(r.reviewedAt ?? null)}</td>
              )}
              <td className="py-2">
                {readOnly ? (
                  <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[r.status] ?? "text-gray-600 bg-gray-100"}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                    {r.reviewNote ? ` — ${r.reviewNote}` : ""}
                  </span>
                ) : (
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
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
