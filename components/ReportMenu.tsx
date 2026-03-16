"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reportPostAction, reportCommentAction } from "@/app/actions/report";
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const REPORT_REASONS = [
    { value: "spam", label: t.report.reasons.spam },
    { value: "harmful", label: t.report.reasons.harmful },
    { value: "harassment", label: t.report.reasons.harassment },
    { value: "other", label: t.report.reasons.other },
  ] as const;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
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
      setError(result.error ?? t.report.submitError);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {t.report.button}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-theme-border bg-theme-surface py-2 shadow-md">
            <form onSubmit={handleSubmit} className="px-3">
              {error && (
                <p className="mb-2 text-sm text-theme-warning" role="alert">
                  {error}
                </p>
              )}
              <label htmlFor="report-reason" className="block text-sm font-medium text-theme-text mb-2">
                {t.report.reasonLabel}
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full rounded-md border border-theme-border bg-theme-surface-2 px-2 py-1.5 text-sm text-theme-text focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
                required
              >
                <option value="">{t.report.selectPlaceholder}</option>
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
                  className="rounded-button bg-theme-primary px-2 py-1 text-sm font-medium text-white hover:bg-theme-primary-2 transition-colors disabled:opacity-40"
                >
                  {t.report.submit}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-button border border-theme-border px-2 py-1 text-sm font-medium text-theme-muted hover:bg-theme-surface-2 transition-colors"
                >
                  {t.report.cancel}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
