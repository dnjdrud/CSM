"use client";

import { useEffect, useRef } from "react";
import { FEATURES } from "@/lib/config/features";
import { subscribeToTable } from "@/lib/supabase/realtime";
import type { Comment, User } from "@/lib/domain/types";
import { getCommentByIdAction } from "../actions";

type CommentWithAuthor = Comment & { author: User };

/**
 * Subscribe to realtime comment inserts/deletes for a post.
 * On INSERT fetches the full comment+author via server action.
 */
export function useRealtimeComments(
  postId: string,
  setComments: React.Dispatch<React.SetStateAction<CommentWithAuthor[]>>
) {
  const setRef = useRef(setComments);
  setRef.current = setComments;

  useEffect(() => {
    if (!FEATURES.REALTIME_COMMENTS || !postId) return;

    const unsub = subscribeToTable<{
      id: string;
      post_id: string;
      author_id: string;
      content: string;
      parent_id?: string | null;
      created_at?: string | null;
    }>({
      table: "comments",
      filter: `post_id=eq.${postId}`,
      onInsert: (payload) => {
        const row = payload.new;
        if (!row?.id) return;
        getCommentByIdAction(row.id).then((comment) => {
          if (!comment) return;
          setRef.current((prev) => {
            if (prev.some((c) => c.id === comment.id)) return prev;
            return [...prev, comment];
          });
        });
      },
      onDelete: (payload) => {
        const row = payload.old as { id?: string };
        if (!row?.id) return;
        setRef.current((prev) => prev.filter((c) => c.id !== row.id));
      },
      onUpdate: (payload) => {
        const row = payload.new;
        if (!row?.id) return;
        setRef.current((prev) =>
          prev.map((c) =>
            c.id === row.id ? { ...c, content: row.content ?? c.content } : c
          )
        );
      },
    });

    return unsub;
  }, [postId]);
}
