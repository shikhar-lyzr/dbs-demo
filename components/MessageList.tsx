"use client";

import type { ChatMessage } from "@/lib/types";

export function MessageList({
  messages,
  pending,
  loading = false,
}: {
  messages: ChatMessage[];
  pending: string;
  loading?: boolean;
}) {
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
      {loading && !pending && <TypingBubble />}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 text-gray-900 rounded-2xl px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-1" aria-label="Assistant is typing">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </span>
      </div>
    </div>
  );
}

function Bubble({ role, text }: { role: ChatMessage["role"]; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words bubble-content ${
          isUser ? "bg-red-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
        dangerouslySetInnerHTML={{ __html: renderInline(text, isUser) }}
      />
    </div>
  );
}

// Render minimal markdown: [label](href) → clickable link that navigates the parent.
// Escapes all other content to prevent injection.
function renderInline(text: string, isUser: boolean): string {
  const escaped = escapeHtml(text);
  if (isUser) return escaped;
  const linkClass = "underline font-medium text-red-700 hover:text-red-800";
  return escaped.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, label, href) =>
      `<a href="${href}" data-navparent="1" class="${linkClass}">${label}</a>`,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
