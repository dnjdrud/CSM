"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToTable } from "@/lib/supabase/realtime";
import type { CellMessage } from "@/lib/domain/types";

interface CellChatProps {
  cellId: string;
  userId: string;
  isMember: boolean;
}

export function CellChat({ cellId, userId, isMember }: CellChatProps) {
  const [messages, setMessages] = useState<CellMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Load initial messages
    fetch(`/api/cell/${cellId}/messages`)
      .then((res) => res.json())
      .then((msgs) => {
        setMessages(msgs);
        setLoading(false);
        // Scroll to bottom after loading
        setTimeout(scrollToBottom, 100);
      })
      .catch((error) => {
        console.error("Failed to load messages:", error);
        setLoading(false);
      });

    // Subscribe to new messages
    const unsubscribe = subscribeToTable<CellMessage>({
      table: "cell_messages",
      filter: `cell_id=eq.${cellId}`,
      onInsert: (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        // Scroll to bottom when new message arrives
        setTimeout(scrollToBottom, 100);
      },
    });

    return unsubscribe;
  }, [cellId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const response = await fetch(`/api/cell/${cellId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (response.ok) {
        setContent("");
        // The new message will be added via realtime subscription
      } else {
        console.error("Failed to post message");
      }
    } catch (error) {
      console.error("Failed to post message:", error);
    }
  };

  if (loading) return <div>Loading messages...</div>;

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="border p-2 rounded">
            <p className="text-sm text-theme-muted">{m.authorId}</p>
            <p>{m.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isMember && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Type a message..."
            className="w-full border p-2"
            required
          />
          <button type="submit" className="px-4 py-2 bg-theme-primary text-white rounded">
            Send
          </button>
        </form>
      )}
    </div>
  );
}