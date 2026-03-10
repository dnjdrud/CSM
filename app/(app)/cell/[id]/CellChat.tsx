"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToTable } from "@/lib/supabase/realtime";
import type { CellMessage } from "@/lib/domain/types";

interface CellChatProps {
  cellId: string;
  userId: string;
  userName: string;
  isMember: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function CellChat({ cellId, userId, userName, isMember }: CellChatProps) {
  const [messages, setMessages] = useState<CellMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // authorId → name 캐시: 초기 로드 메시지에서 구축, 리얼타임 메시지에도 활용
  const nameCacheRef = useRef<Map<string, string>>(new Map());

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  // 초기 메시지 로드 + 리얼타임 구독
  useEffect(() => {
    fetch(`/api/cell/${cellId}/messages`)
      .then((res) => res.json())
      .then((msgs: CellMessage[]) => {
        if (Array.isArray(msgs)) {
          // 이름 캐시 구축
          msgs.forEach((m) => {
            if (m.authorId && m.authorName) {
              nameCacheRef.current.set(m.authorId, m.authorName);
            }
          });
          setMessages(msgs);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const unsubscribe = subscribeToTable({
      table: "cell_messages",
      filter: `cell_id=eq.${cellId}`,
      onInsert: (payload) => {
        // Supabase postgres_changes는 snake_case DB 컬럼으로 payload를 보냄
        const raw = payload.new as Record<string, unknown>;
        const authorId = (raw.author_id ?? raw.authorId) as string;

        // 이름 결정: 본인 → userName prop, 캐시에 있으면 캐시값, 없으면 "멤버"
        const authorName =
          authorId === userId
            ? userName
            : (nameCacheRef.current.get(authorId) ?? "멤버");

        const msg: CellMessage = {
          id: raw.id as string,
          cellId: (raw.cell_id ?? raw.cellId) as string,
          authorId,
          authorName,
          content: raw.content as string,
          createdAt: (raw.created_at ?? raw.createdAt) as string,
        };
        setMessages((prev) => [...prev, msg]);
      },
    });

    return unsubscribe;
  }, [cellId, userId, userName]);

  // 초기 로드 완료 후 맨 아래로 스크롤 (React 렌더 완료 이후 실행)
  useEffect(() => {
    if (!loading) {
      scrollToBottom("instant");
    }
    // loading이 false로 바뀔 때만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // 새 메시지 수신 시 맨 아래로
  const prevLengthRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      prevLengthRef.current = messages.length;
      if (!loading) scrollToBottom("smooth");
    }
  }, [messages.length, loading]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/cell/${cellId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        setContent("");
        textareaRef.current?.focus();
      }
    } catch {
      // 리얼타임이 오지 않으면 사용자가 재시도
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-theme-muted text-sm">
        메시지 불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 220px)", minHeight: 300 }}>
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-theme-muted text-sm py-8">
            아직 메시지가 없습니다. 첫 메시지를 보내보세요!
          </p>
        )}
        {messages.map((m, i) => {
          const isMine = m.authorId === userId;
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const showName = !isMine && prevMsg?.authorId !== m.authorId;

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
            >
              {showName && (
                <span className="text-xs text-theme-muted mb-0.5 px-1">
                  {m.authorName}
                </span>
              )}
              <div className="flex items-end gap-1.5 max-w-[78%]">
                {isMine && (
                  <span className="text-[10px] text-theme-muted mb-0.5 shrink-0">
                    {formatTime(m.createdAt)}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${
                    isMine
                      ? "bg-theme-primary text-white rounded-br-sm"
                      : "bg-theme-surface border border-theme-border text-theme-text rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
                {!isMine && (
                  <span className="text-[10px] text-theme-muted mb-0.5 shrink-0">
                    {formatTime(m.createdAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      {isMember ? (
        <div className="shrink-0 border-t border-theme-border bg-theme-bg px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="메시지 입력… (Enter 전송, Shift+Enter 줄바꿈)"
              className="flex-1 resize-none rounded-2xl border border-theme-border bg-theme-surface px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/30 max-h-32 overflow-y-auto"
              style={{ lineHeight: "1.4" }}
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || sending}
              className="shrink-0 w-10 h-10 rounded-full bg-theme-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
              aria-label="전송"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-theme-border bg-theme-bg px-4 py-3 text-center text-sm text-theme-muted">
          셀에 참여하면 메시지를 보낼 수 있습니다.
        </div>
      )}
    </div>
  );
}
