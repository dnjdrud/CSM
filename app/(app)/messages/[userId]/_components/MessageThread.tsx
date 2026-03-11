"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { DirectMessage, User } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils/time";
import { sendMessageAction, markConversationReadAction } from "../../actions";

type MessageWithSender = DirectMessage & { sender: User };

export function MessageThread({
  initialMessages,
  currentUserId,
  partner,
}: {
  initialMessages: MessageWithSender[];
  currentUserId: string;
  partner: User;
}) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    markConversationReadAction(partner.id);
  }, [partner.id]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isPending) return;
    const optimistic: MessageWithSender = {
      id: `optimistic-${Date.now()}`,
      senderId: currentUserId,
      recipientId: partner.id,
      content: trimmed,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "나", role: "LAY", createdAt: new Date().toISOString() },
    };
    setMessages((prev) => [...prev, optimistic]);
    setContent("");
    setError(null);
    startTransition(async () => {
      const result = await sendMessageAction(partner.id, trimmed);
      if (!result.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setError(result.error ?? "전송 실패");
        setContent(trimmed);
      } else if (result.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...result.message!, sender: optimistic.sender } : m))
        );
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
        <Link href="/messages" className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 rounded">
          ←
        </Link>
        <Link href={`/profile/${partner.id}`} className="flex items-center gap-2 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 rounded">
          <Avatar name={partner.name} size="sm" className="h-8 w-8" />
          <span className="font-medium text-gray-900 text-[15px]">{partner.name}</span>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">대화를 시작해보세요</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
              {!isMine && <Avatar name={partner.name} size="sm" className="h-7 w-7 shrink-0 self-end" />}
              <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-[14px] leading-6 whitespace-pre-wrap break-words ${
                    isMine
                      ? "bg-gray-800 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <time className="text-[11px] text-gray-400">
                  {formatRelativeTime(new Date(msg.createdAt))}
                </time>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="shrink-0 px-4 pb-4 pt-2 border-t border-gray-200">
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="메시지 입력… (Enter로 전송)"
            disabled={isPending}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 resize-none min-h-[2.5rem] max-h-32 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-50 shrink-0"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
}
