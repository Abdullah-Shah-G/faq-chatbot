"use client";

import { useState, useRef, useEffect } from "react";
import type { Message, ChatResponse } from "@/lib/types";

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm SupportBot. Ask me anything about our products, billing, or account management.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "session_1",
          message: userMsg.content,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data: ChatResponse = await res.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        matchedFaqId: data.matched_faq_id,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>SupportBot</h1>
        <a href="/admin" className="admin-link">Manage FAQ</a>
      </header>

      <div className="messages-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">
              <p>{msg.content}</p>
              {msg.role === "assistant" && msg.matchedFaqId && (
                <span className="faq-badge">Answered from FAQ</span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-content">
              <p className="typing">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="input-area" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
