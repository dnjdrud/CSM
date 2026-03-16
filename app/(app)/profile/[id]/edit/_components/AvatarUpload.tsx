"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadAvatarAction } from "../../actions";

type Props = {
  currentAvatarUrl?: string | null;
  name: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

export function AvatarUpload({ currentAvatarUrl, name }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displaySrc = preview ?? currentAvatarUrl ?? null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSaved(false);

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Auto-upload immediately
    setPending(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const result = await uploadAvatarAction(fd);
    setPending(false);

    if (result.ok) {
      setSaved(true);
    } else {
      setError(result.error ?? "업로드 실패");
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden bg-theme-surface-2 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:opacity-60"
        aria-label="프로필 사진 변경"
      >
        {displaySrc ? (
          <Image src={displaySrc} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-medium text-theme-muted">
            {getInitials(name)}
          </span>
        )}
        {!pending && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-xs">변경</span>
          </span>
        )}
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-white text-[10px] font-medium">업로드 중…</span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="rounded-button border border-theme-border px-3 py-1.5 text-xs font-medium text-theme-muted hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "업로드 중…" : "사진 변경"}
        </button>
        {error && <p className="text-xs text-theme-danger">{error}</p>}
        {saved && <p className="text-xs text-theme-success">✓ 업로드 완료</p>}
        <p className="text-xs text-theme-muted">JPG, PNG, WEBP · 최대 5MB</p>
      </div>
    </div>
  );
}
