"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DangerZoneConfirm } from "@/app/(admin)/admin/_components/DangerZoneConfirm";
import { deactivateAccountAction, restoreAccountAction } from "../actions";

type Props = {
  canRestore: boolean;
  isDeactivated: boolean;
};

export function DeleteAccountSection({ canRestore, isDeactivated }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleDeactivate() {
    setMessage(null);
    const result = await deactivateAccountAction();
    if (!result.ok) setMessage({ type: "error", text: result.error ?? "Failed to deactivate" });
    else router.refresh();
  }

  async function handleRestore() {
    setMessage(null);
    const result = await restoreAccountAction();
    if (result.ok) {
      setMessage({ type: "success", text: "Account restored." });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to restore" });
    }
  }

  if (isDeactivated && canRestore) {
    return (
      <section className="mt-10 pt-8 border-t border-theme-border" aria-labelledby="restore-heading">
        <h2 id="restore-heading" className="text-lg font-serif font-normal text-theme-text">
          Restore account
        </h2>
        <p className="mt-2 text-sm text-theme-muted">
          Your account is deactivated. You can restore it within 7 days.
        </p>
        <button
          type="button"
          onClick={handleRestore}
          className="mt-3 rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
        >
          Restore account
        </button>
        {message && (
          <p className={`mt-2 text-sm ${message.type === "error" ? "text-theme-danger" : "text-theme-success"}`} role="alert">
            {message.text}
          </p>
        )}
      </section>
    );
  }

  if (isDeactivated) {
    return (
      <section className="mt-10 pt-8 border-t border-theme-border" aria-labelledby="deactivated-heading">
        <h2 id="deactivated-heading" className="text-lg font-serif font-normal text-theme-text">
          Account deactivated
        </h2>
        <p className="mt-2 text-sm text-theme-muted">
          The 7-day restore window has passed. Contact support if you need assistance.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 pt-8 border-t border-theme-border" aria-labelledby="delete-account-heading">
      <h2 id="delete-account-heading" className="text-lg font-serif font-normal text-theme-text">
        Delete account
      </h2>
      <p className="mt-2 text-sm text-theme-muted mb-4">
        Your account will be deactivated for 7 days. You can restore it during that time.
      </p>
      {message && (
        <p className={`mb-2 text-sm ${message.type === "error" ? "text-theme-danger" : "text-theme-success"}`} role="alert">
          {message.text}
        </p>
      )}
      <DangerZoneConfirm
        title="Delete account"
        description="Your account will be deactivated. Your posts will be hidden. You can restore within 7 days by signing in again and visiting your profile."
        confirmText="delete my account"
        onConfirm={handleDeactivate}
        buttonLabel="Delete my account"
      />
    </section>
  );
}
