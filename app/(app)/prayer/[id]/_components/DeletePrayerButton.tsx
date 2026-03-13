"use client";

import { useTransition } from "react";
import { deletePrayerRequestAction } from "../../actions";

export function DeletePrayerButton({ prayerRequestId }: { prayerRequestId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("삭제하시겠습니까?")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", prayerRequestId);
      await deletePrayerRequestAction(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-[12px] text-red-500 hover:text-red-700 disabled:opacity-40"
    >
      {pending ? "삭제 중…" : "삭제"}
    </button>
  );
}
