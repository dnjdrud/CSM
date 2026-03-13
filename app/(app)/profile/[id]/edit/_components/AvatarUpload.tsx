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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSaved(false);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) { setError("파일을 먼저 선택해주세요."); return; }
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.append("avatar", file);
    const result = await uploadAvatarAction(fd);
    setPending(false);
    if (result.ok) {
      setSaved(true);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } else {
      setError(result.error ?? "업로드 실패");
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden bg-gray-200 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
        aria-label="프로필 사진 변경"
      >
        {displaySrc ? (
          <Image src={displaySrc} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-600">
            {getInitials(name)}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-white text-xs">변경</span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-1">
        {preview ? (
          <button
            type="button"
            onClick={handleUpload}
            disabled={pending}
            className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "업로드 중…" : "업로드"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700"
          >
            사진 선택
          </button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {saved && <p className="text-xs text-green-600">저장되었습니다.</p>}
        <p className="text-xs text-gray-400">JPG, PNG, WEBP · 최대 5MB</p>
      </div>
    </div>
  );
}
