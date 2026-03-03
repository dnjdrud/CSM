"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InviteCode } from "@/lib/domain/types";
import { DangerZoneConfirm } from "../../_components/DangerZoneConfirm";
import { EditInviteModal, getInviteMessage } from "./EditInviteModal";
import { revokeInviteAction } from "../actions";

type Props = {
  invite: InviteCode;
  isComposerOpen?: boolean;
  onToggleMessages?: () => void;
};

export function InviteRowActions({ invite, isComposerOpen, onToggleMessages }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokePending, setRevokePending] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(invite.code);
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(getInviteMessage(invite.code));
  }

  async function handleRevoke() {
    setRevokePending(true);
    try {
      const res = await revokeInviteAction(invite.id);
      if (res.ok) {
        setRevokeOpen(false);
        router.refresh();
      }
    } finally {
      setRevokePending(false);
    }
  }

  const canEdit = invite.status === "ACTIVE";
  const canRevoke = invite.status === "ACTIVE";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={copyCode}
          className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Copy code
        </button>
        <button
          type="button"
          onClick={copyMessage}
          className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Copy message
        </button>
        {onToggleMessages && (
          <button
            type="button"
            onClick={onToggleMessages}
            className={`rounded border px-2 py-0.5 text-xs font-medium ${isComposerOpen ? "border-gray-600 bg-gray-200 text-gray-800" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            Messages
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
        )}
        {canRevoke && (
          <button
            type="button"
            onClick={() => setRevokeOpen(true)}
            className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Revoke
          </button>
        )}
      </div>
      {editOpen && <EditInviteModal invite={invite} onClose={() => setEditOpen(false)} />}
      {revokeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRevokeOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <DangerZoneConfirm
              title="Revoke invite"
              description="This invite will no longer work. Existing sign-ups are not affected."
              confirmText="revoke invite"
              buttonLabel="Revoke invite"
              onConfirm={handleRevoke}
              disabled={revokePending}
            />
          </div>
        </div>
      )}
    </>
  );
}
