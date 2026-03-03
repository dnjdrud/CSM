"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InviteCode } from "@/lib/domain/types";
import { DangerZoneConfirm } from "../../_components/DangerZoneConfirm";
import { EditInviteModal, getInviteMessage } from "./EditInviteModal";
import { revokeInviteAction, sendInviteEmailAction } from "../actions";

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
  const [sendLinkOpen, setSendLinkOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sendPending, setSendPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(invite.code);
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(getInviteMessage(invite.code));
  }

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(false);
    setSendPending(true);
    try {
      const res = await sendInviteEmailAction(invite.id, sendEmail);
      if (res.ok) {
        setSendSuccess(true);
        setSendEmail("");
        setTimeout(() => {
          setSendLinkOpen(false);
          setSendSuccess(false);
        }, 1500);
      } else {
        setSendError(res.error);
      }
    } finally {
      setSendPending(false);
    }
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
        {canEdit && (
          <button
            type="button"
            onClick={() => { setSendLinkOpen(true); setSendError(null); setSendSuccess(false); }}
            className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Send link
          </button>
        )}
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
      {sendLinkOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !sendPending && setSendLinkOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-800">Send invite link</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              We&apos;ll email the invite code and sign-in link to the address below.
            </p>
            {sendSuccess ? (
              <p className="mt-3 text-sm text-green-700">Email sent.</p>
            ) : (
              <form onSubmit={handleSendLink} className="mt-3 space-y-3">
                <label className="block">
                  <span className="text-xs text-gray-600">Email</span>
                  <input
                    type="email"
                    value={sendEmail}
                    onChange={(e) => setSendEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    required
                  />
                </label>
                {sendError && <p className="text-sm text-red-600">{sendError}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => !sendPending && setSendLinkOpen(false)}
                    className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendPending}
                    className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {sendPending ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
