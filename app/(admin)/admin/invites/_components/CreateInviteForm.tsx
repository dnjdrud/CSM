"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { createInviteAction } from "../actions";

export function CreateInviteForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ code: string } | { error: string } | null>(null);
  const toast = useToast();
  const [expiresPreset, setExpiresPreset] = useState<string>("none");
  const [customExpires, setCustomExpires] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("maxUses", (form.querySelector('[name="maxUses"]') as HTMLInputElement)?.value ?? "1");
    formData.set("expiresPreset", expiresPreset);
    if (expiresPreset === "custom" && customExpires) formData.set("expiresAt", customExpires);
    setPending(true);
    try {
      const res = await createInviteAction(formData);
      if (res.ok) {
        setResult({ code: res.code });
        router.refresh();
        toast.show("Invite created.");
      } else {
        setResult({ error: res.error });
        toast.error(res.error ?? "Something went wrong");
      }
    } finally {
      setPending(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <h2 className="text-sm font-medium text-gray-800">Create invite</h2>
      <p className="mt-0.5 text-xs text-gray-500">Set max uses, optional expiry, and a note for your records.</p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-600">Max uses</span>
          <input
            name="maxUses"
            type="number"
            min={1}
            defaultValue={1}
            className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-600">Expires</span>
          <select
            value={expiresPreset}
            onChange={(e) => setExpiresPreset(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="none">Never</option>
            <option value="7days">7 days</option>
            <option value="30days">30 days</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        {expiresPreset === "custom" && (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">Expiry date</span>
            <input
              type="datetime-local"
              value={customExpires}
              onChange={(e) => setCustomExpires(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-600">Note (optional)</span>
          <input
            name="note"
            type="text"
            placeholder="Who is this for?"
            className="min-w-[180px] rounded border border-gray-300 px-2 py-1.5 text-sm placeholder:text-gray-400"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create invite"}
        </button>
      </form>
      {result && "code" in result && (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Invite created.</span>
            <code className="rounded bg-gray-200 px-2 py-0.5 font-mono text-gray-800">{result.code}</code>
            <button
              type="button"
              onClick={() => copyCode(result.code)}
              className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Copy code
            </button>
          </div>
        </div>
      )}
      {result && "error" in result && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {result.error}
        </p>
      )}
    </div>
  );
}
