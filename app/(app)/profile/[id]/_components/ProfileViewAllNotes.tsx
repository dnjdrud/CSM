"use client";

import { useState, useTransition } from "react";
import type { Note } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";

const NOTE_TYPE_LABEL: Record<string, string> = {
  PRAYER_REQUEST: "기도 제목",
  JOURNAL: "묵상",
  TESTIMONY: "간증",
  SERMON_NOTE: "설교 노트",
  GRATITUDE: "감사",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Props = {
  notes: Note[];
  profileId: string;
  blocked?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  initialHasMore?: boolean;
  loadMoreAction?: (profileId: string, offset: number) => Promise<{ items: Note[]; hasMore: boolean }>;
};

export function ProfileViewAllNotes({
  notes: initialNotes,
  profileId,
  blocked,
  emptyTitle,
  emptyDescription,
  initialHasMore = false,
  loadMoreAction,
}: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    if (!loadMoreAction) return;
    startTransition(async () => {
      const result = await loadMoreAction(profileId, notes.length);
      setNotes((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
    });
  }

  if (blocked) {
    return <p className="text-[15px] text-neutral-500">차단한 사용자입니다.</p>;
  }
  if (notes.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? "아직 노트가 없어요"}
        description={emptyDescription ?? "공유된 노트가 여기에 표시됩니다."}
      />
    );
  }

  return (
    <>
      <ul className="list-none p-0 space-y-3" role="list">
        {notes.map((note) => (
          <li key={note.id}>
            <article className="rounded-xl border border-theme-border bg-theme-surface px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {note.title && (
                    <h3 className="text-[15px] font-medium text-theme-text leading-snug mb-1">
                      {note.title}
                    </h3>
                  )}
                  <p className="text-[14px] text-theme-text leading-7 whitespace-pre-wrap font-sans">
                    {note.content}
                  </p>
                </div>
                {note.type && NOTE_TYPE_LABEL[note.type] && (
                  <span className="shrink-0 mt-0.5 rounded-full border border-theme-border bg-theme-surface-2 px-2 py-0.5 text-[11px] text-theme-muted">
                    {NOTE_TYPE_LABEL[note.type]}
                  </span>
                )}
              </div>
              <time dateTime={note.createdAt} className="text-[11px] text-theme-muted mt-3 block">
                {formatDate(note.createdAt)}
              </time>
            </article>
          </li>
        ))}
      </ul>
      {hasMore && loadMoreAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40"
          >
            {isPending ? "불러오는 중…" : "더 보기"}
          </button>
        </div>
      )}
    </>
  );
}
