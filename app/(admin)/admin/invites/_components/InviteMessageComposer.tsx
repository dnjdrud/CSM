"use client";

import { useState } from "react";
import { TEMPLATES } from "@/lib/invites/templates";
import type { InviteTemplateKey } from "@/lib/invites/types";
import { buildInviteVars, renderInviteTemplate } from "@/lib/invites/render";

type Props = {
  code: string;
  expiresAt: string | null;
  maxUses: number;
  note?: string | null;
};

const TEMPLATE_KEYS: InviteTemplateKey[] = [
  "general",
  "church_group",
  "mission_team",
  "pastoral_circle",
  "seminary_cohort",
];

export function InviteMessageComposer({ code, expiresAt, maxUses, note }: Props) {
  const [templateKey, setTemplateKey] = useState<InviteTemplateKey>("general");
  const [personal, setPersonal] = useState("");
  const [variant, setVariant] = useState<"dm" | "email">("dm");
  const [copied, setCopied] = useState<"dm" | "email" | null>(null);

  const vars = buildInviteVars({ code, expiresAt, maxUses, note, personal });
  const t = TEMPLATES[templateKey];
  const dmText = renderInviteTemplate(t.dm, vars);
  const emailText = renderInviteTemplate(t.email, vars);
  const previewText = variant === "dm" ? dmText : emailText;

  async function copyDm() {
    await navigator.clipboard.writeText(dmText);
    setCopied("dm");
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyEmail() {
    await navigator.clipboard.writeText(emailText);
    setCopied("email");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded border border-gray-200 bg-gray-50/80 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span className="text-gray-600">Template</span>
          <select
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value as InviteTemplateKey)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-800"
          >
            {TEMPLATE_KEYS.map((k) => (
              <option key={k} value={k}>
                {TEMPLATES[k].label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setVariant("dm")}
            className={`rounded px-2 py-1 text-xs font-medium ${variant === "dm" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            DM
          </button>
          <button
            type="button"
            onClick={() => setVariant("email")}
            className={`rounded px-2 py-1 text-xs font-medium ${variant === "email" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            Email
          </button>
        </div>
      </div>
      <label className="mt-2 block">
        <span className="text-gray-600">Optional personal note (one short paragraph)</span>
        <textarea
          value={personal}
          onChange={(e) => setPersonal(e.target.value)}
          placeholder="Optional personal note (one short paragraph)."
          rows={2}
          className="mt-0.5 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-gray-800 placeholder:text-gray-400"
        />
      </label>
      <div className="mt-2">
        <span className="text-gray-600">Preview</span>
        <pre className="mt-0.5 max-h-48 overflow-auto rounded border border-gray-200 bg-white p-2 font-mono text-xs text-gray-800 whitespace-pre-wrap break-words">
          {previewText}
        </pre>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyDm}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Copy DM
        </button>
        <button
          type="button"
          onClick={copyEmail}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Copy Email
        </button>
        {copied && <span className="text-xs text-gray-600">Copied.</span>}
      </div>
    </div>
  );
}
