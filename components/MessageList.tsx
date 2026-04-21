"use client";

import type { ChatMessage } from "@/lib/types";

export function MessageList({ messages, pending }: { messages: ChatMessage[]; pending: string }) {
  return (
    <div className="chat-scroll flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.length === 0 && !pending && (
        <div className="text-sm text-gray-500">
          Hi! I can help if you're stuck opening your DBS savings account. What are you trying to do?
        </div>
      )}
      {messages.map((m, i) => (
        <Bubble key={i} role={m.role} text={m.content} />
      ))}
      {pending && <Bubble role="assistant" text={pending} />}
    </div>
  );
}

function Bubble({ role, text }: { role: ChatMessage["role"]; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser ? "bg-red-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
