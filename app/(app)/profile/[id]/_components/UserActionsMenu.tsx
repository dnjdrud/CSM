"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleMuteAction, toggleBlockAction } from "../actions";
import { reportUserAction } from "@/app/actions/report";
import { useT } from "@/lib/i18n";

export function UserActionsMenu({
  targetUserId,
  targetUserName,
  isMuted,
  isBlocked,
}: {
  targetUserId: string;
  targetUserName: string;
  isMuted: boolean;
  isBlocked: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "done" | "error">("idle");

  async function handleMute() {
    if (pending) return;
    setPending(true);
    await toggleMuteAction(targetUserId);
    setPending(false);
    setOpen(false);
    router.refresh();
  }

  async function handleBlock() {
    if (pending) return;
    setPending(true);
    await toggleBlockAction(targetUserId);
    setPending(false);
    setOpen(false);
    router.refresh();
  }

  async function handleReport() {
    if (pending) return;
    setPending(true);
    const result = await reportUserAction(targetUserId, reportReason);
    setPending(false);
    if (result.ok) {
      setReportStatus("done");
      setReportReason("");
      setTimeout(() => {
        setShowReportForm(false);
        setReportStatus("idle");
        setOpen(false);
      }, 1500);
    } else {
      setReportStatus("error");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded transition-colors duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:bg-gray-200/80"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User actions"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => { setOpen(false); setShowReportForm(false); setReportStatus("idle"); }}
          />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={handleMute}
              disabled={pending}
              className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-inset disabled:opacity-50"
            >
              {isMuted ? t.userMenu.unmute : t.userMenu.mute}
            </button>
            <button
              type="button"
              onClick={handleBlock}
              disabled={pending}
              className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-inset disabled:opacity-50"
            >
              {isBlocked ? t.userMenu.unblock : t.userMenu.block}
            </button>
            <hr className="my-1 border-gray-100" />
            {!showReportForm ? (
              <button
                type="button"
                onClick={() => setShowReportForm(true)}
                className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-inset"
              >
                {t.userMenu.report}
              </button>
            ) : (
              <div className="px-3 py-2 space-y-2">
                {reportStatus === "done" ? (
                  <p className="text-xs text-green-600 font-medium">{t.userMenu.reportSuccess}</p>
                ) : (
                  <>
                    <p className="text-xs font-medium text-gray-700">{targetUserName} {t.userMenu.reportTitle}</p>
                    <textarea
                      rows={2}
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder={t.userMenu.reportPlaceholder}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs resize-none focus:outline-none focus:border-gray-400"
                    />
                    {reportStatus === "error" && (
                      <p className="text-xs text-red-600">{t.userMenu.reportError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleReport}
                        disabled={pending}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {pending ? `${t.common.loading}` : t.userMenu.reportSubmit}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowReportForm(false); setReportStatus("idle"); setReportReason(""); }}
                        className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
