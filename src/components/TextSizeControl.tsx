"use client";

import { useState } from "react";
import { TEXT_SIZE_COOKIE, TEXT_SIZE_LABEL, nextTextSize, type TextSize } from "@/lib/text-size";

/** Cycles 보통 → 크게 → 아주 크게. Stored as a plain UI-preference cookie. */
export function TextSizeControl({ initial }: { initial: TextSize }) {
  const [size, setSize] = useState<TextSize>(initial);

  function cycle() {
    const next = nextTextSize(size);
    setSize(next);
    document.documentElement.dataset.text = next;
    document.cookie = `${TEXT_SIZE_COOKIE}=${next}; path=/; max-age=31536000; samesite=strict`;
  }

  return (
    <button type="button" onClick={cycle} className="btn btn-secondary">
      <span>
        글씨 크기: {TEXT_SIZE_LABEL[size]}
        <span className="sr-only">. 누르면 {TEXT_SIZE_LABEL[nextTextSize(size)]}로 바뀌어요</span>
      </span>
    </button>
  );
}
