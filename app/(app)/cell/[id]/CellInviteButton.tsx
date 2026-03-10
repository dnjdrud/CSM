"use client";

import { useState } from "react";

export function CellInviteButton({ cellId }: { cellId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cell/${cellId}/invite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setUrl(data.url);
      }
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (url) {
    return (
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="text-xs border border-theme-border rounded px-2 py-1 bg-theme-surface text-theme-muted w-44 truncate"
        />
        <button
          onClick={copy}
          className="text-xs px-2 py-1 border border-theme-border rounded text-theme-text hover:bg-theme-surface transition-colors"
        >
          {copied ? "복사됨!" : "복사"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="px-3 py-1.5 text-sm border border-theme-border rounded-lg text-theme-text hover:bg-theme-surface transition-colors disabled:opacity-50"
    >
      {loading ? "생성 중…" : "🔗 초대 링크"}
    </button>
  );
}
