"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reportPostAction, reportCommentAction } from "@/app/actions/report";

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harmful", label: "Harmful or unsafe" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
] as const;

export function ReportMenu({
  targetType,
  postId,
  commentId,
  onReported,
}: {
  targetType: "post" | "comment";
  postId: string;
  commentId?: string;
  onReported?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason || pending) return;
    setPending(true);
    setError(null);
    const result =
      targetType === "post"
        ? await reportPostAction(postId, reason)
        : commentId
          ? await reportCommentAction(commentId, postId, reason)
          : { ok: false as const, error: "Missing comment" };
    setPending(false);
    if (result.ok) {
      setOpen(false);
      setReason("");
      router.refresh();
      onReported?.();
    } else {
      setError(result.error ?? "Failed to submit report");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Report
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-md border border-gray-200 bg-white py-2 shadow-lg">
            <form onSubmit={handleSubmit} className="px-3">
              {error && (
                <p className="mb-2 text-sm text-amber-600" role="alert">
                  {error}
                </p>
              )}
              <label htmlFor="report-reason" className="block text-sm font-medium text-gray-800 mb-2">
                Reason
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-800 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700"
                required
              >
                <option value="">Select…</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded bg-gray-800 px-2 py-1 text-sm font-medium text-gray-50 hover:bg-gray-700 disabled:opacity-40"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-gray-200 px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
