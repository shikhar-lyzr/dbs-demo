"use client";

import { useRef, useState } from "react";
import type { ChatMessage, PageContext } from "@/lib/types";
import { MessageList } from "./MessageList";
import { useParentContext } from "./useParentContext";

export function ChatWidget() {
  const context: PageContext = useParentContext();
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState("");
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setPending("");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, context }),
        signal: ac.signal,
      });
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPending(acc);
      }
      setMessages((m) => [...m, { role: "assistant", content: acc }]);
      setPending("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((m) => [...m, { role: "assistant", content: `Sorry — something went wrong (${msg}).` }]);
      setPending("");
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 h-14 w-14 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
        aria-label="Open help chat"
      >
        ?
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 w-[360px] h-[520px] rounded-2xl shadow-2xl bg-white flex flex-col overflow-hidden border border-gray-200">
      <header className="flex items-center justify-between px-4 py-3 bg-red-600 text-white">
        <div>
          <div className="font-semibold text-sm">DBS Help</div>
          <div className="text-xs opacity-80">{summarize(context)}</div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close" className="text-white text-lg leading-none">×</button>
      </header>

      <MessageList messages={messages} pending={pending} />

      <footer className="border-t border-gray-200 p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask about this step…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={sending}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm disabled:opacity-40"
        >
          Send
        </button>
      </footer>
    </div>
  );
}

function summarize(ctx: PageContext): string {
  if (ctx.stuckField) return `Help with: ${ctx.stuckField}`;
  if (ctx.page) return ctx.step ? `${ctx.page} · step ${ctx.step}` : ctx.page;
  return "Ready to help";
}
