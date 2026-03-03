"use client";

import { useState, Fragment } from "react";
import type { InviteCode } from "@/lib/domain/types";
import { InviteRowActions } from "./InviteRowActions";
import { InviteMessageComposer } from "./InviteMessageComposer";

function formatDate(iso: string | undefined | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    EXPIRED: "bg-amber-100 text-amber-800",
    REVOKED: "bg-red-100 text-red-800",
    USED_UP: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

type Props = { invites: InviteCode[] };

export function InvitesTableBody({ invites }: Props) {
  const [openComposerId, setOpenComposerId] = useState<string | null>(null);

  return (
    <tbody>
      {invites.map((inv) => (
        <Fragment key={inv.id}>
          <tr className="border-b border-gray-100">
            <td className="py-3 pr-4 font-mono text-gray-800">{inv.code}</td>
            <td className="py-3 pr-4">
              <StatusBadge status={inv.status} />
            </td>
            <td className="py-3 pr-4 text-gray-600">
              {inv.usesCount} / {inv.maxUses}
            </td>
            <td className="py-3 pr-4 text-gray-500">{formatDate(inv.expiresAt)}</td>
            <td className="py-3 pr-4 text-gray-500 max-w-[140px] truncate" title={inv.note ?? undefined}>
              {inv.note ?? "—"}
            </td>
            <td className="py-3 pr-4 text-gray-500">{formatDate(inv.createdAt)}</td>
            <td className="py-3 pr-4 text-gray-500">{formatDate(inv.usedAt)}</td>
            <td className="py-3">
              <InviteRowActions
                invite={inv}
                isComposerOpen={openComposerId === inv.id}
                onToggleMessages={() => setOpenComposerId((id) => (id === inv.id ? null : inv.id))}
              />
            </td>
          </tr>
          {openComposerId === inv.id && (
            <tr key={`${inv.id}-composer`} className="border-b border-gray-100 bg-gray-50/50">
              <td colSpan={8} className="p-2 align-top">
                <InviteMessageComposer
                  code={inv.code}
                  expiresAt={inv.expiresAt ?? null}
                  maxUses={inv.maxUses}
                  note={inv.note}
                />
              </td>
            </tr>
          )}
        </Fragment>
      ))}
    </tbody>
  );
}
