"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, PageContext } from "@/lib/types";
import { MessageList } from "./MessageList";
import { useParentContext } from "./useParentContext";

export function ChatWidget() {
  const context: PageContext = useParentContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState("");
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Tell the parent page whether we're collapsed (just a button) or expanded
  // (full chat panel) so it can resize the iframe accordingly.
  useEffect(() => {
    try {
      window.parent?.postMessage(
        { type: "bank-help-resize", state: open ? "open" : "collapsed" },
        "*",
      );
    } catch {}
  }, [open]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a[data-navparent='1']") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      e.preventDefault();
      // Ask the parent (bank page) to navigate. Same-origin fallback: open in parent.
      try {
        window.parent?.postMessage({ type: "bank-help-navigate", href }, "*");
      } catch {}
    }
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);

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
      <div ref={rootRef} className="fixed inset-0 flex items-end justify-end p-2 bg-transparent pointer-events-none">
        <button
          onClick={() => setOpen(true)}
          className="h-12 w-12 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 text-xl font-bold pointer-events-auto"
          aria-label="Open help chat"
        >
          ?
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="fixed inset-0 rounded-2xl shadow-2xl bg-white flex flex-col overflow-hidden border border-gray-200">
      <header className="flex items-center justify-between px-4 py-3 bg-red-600 text-white">
        <div>
          <div className="font-semibold text-sm">DBS Help</div>
          <div className="text-xs opacity-80">{summarize(context)}</div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close" className="text-white text-lg leading-none">×</button>
      </header>

      <MessageList messages={messages} pending={pending} loading={sending} />

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
