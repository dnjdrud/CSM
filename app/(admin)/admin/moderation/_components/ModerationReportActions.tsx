"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ModerationReport } from "@/lib/domain/types";
import { DangerZoneConfirm } from "../../_components/DangerZoneConfirm";
import { useToast } from "@/components/ui/Toast";
import { hidePostAction, deleteCommentAction, resolveReportAction } from "../actions";

export function ModerationReportActions({
  report,
  postLink,
}: {
  report: ModerationReport;
  postLink?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const toast = useToast();

  async function handleHidePost() {
    if (!report.postId || pending) return;
    setPending(true);
    const result = await hidePostAction(report.postId, report.id);
    setPending(false);
    if (result.ok) {
      router.refresh();
      toast.show("Hidden.");
    } else {
      toast.error();
    }
  }

  async function handleDeleteComment() {
    if (!report.commentId || pending) return;
    setPending(true);
    const result = await deleteCommentAction(report.commentId, report.id);
    setPending(false);
    if (result.ok) {
      router.refresh();
      toast.show("Deleted.");
    } else {
      toast.error();
    }
  }

  async function handleResolve() {
    if (pending) return;
    setPending(true);
    const result = await resolveReportAction(report.id);
    setPending(false);
    if (result.ok) {
      router.refresh();
      toast.show("Resolved.");
    } else {
      toast.error();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {postLink && (
        <Link
          href={postLink}
          className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          View post
        </Link>
      )}
      {report.type === "REPORT_POST" && report.postId && (
        <DangerZoneConfirm
          title="Hide post"
          description="This post will be hidden from the feed for everyone except the author."
          confirmText="hide post"
          onConfirm={handleHidePost}
          buttonLabel="Hide post"
          disabled={pending}
        />
      )}
      {report.type === "REPORT_COMMENT" && report.commentId && (
        <DangerZoneConfirm
          title="Delete comment"
          description="This comment will be permanently deleted."
          confirmText="delete comment"
          onConfirm={handleDeleteComment}
          buttonLabel="Delete comment"
          disabled={pending}
        />
      )}
      <button
        type="button"
        onClick={handleResolve}
        disabled={pending}
        className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        Resolve
      </button>
    </div>
  );
}
