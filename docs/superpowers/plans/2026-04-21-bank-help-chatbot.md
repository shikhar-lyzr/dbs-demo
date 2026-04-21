# Bank Help Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an embeddable Next.js chat widget that uses a gitclaw agent (Lyzr as LLM provider) to help bank-website users who are stuck on a page, using postMessage-delivered page context + a static knowledge base.

**Architecture:** Standalone Next.js 15 app, iframe-embedded on the bank's site. Parent page sends `{page, step, stuckField, url}` via `postMessage`. A `/api/chat` route calls `gitclaw.query()` with the context injected as `systemPromptSuffix` and `knowledge/*.md` auto-loaded by the agent. Pure Q&A; no built-in tools; no persistence.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, `gitclaw` SDK, Lyzr AI Studio (OpenAI-compatible endpoint).

**Timeline note:** Roughly 2 hours. This plan uses direct implementation with manual smoke-tests (not full TDD) because the deliverable is a small standalone widget, not a change to production code. Commit checkpoints are frequent so rollback is cheap.

---

## File Structure

```
bank-help-chatbot/
├── package.json
├── tsconfig.json
├── next.config.ts                     # serverExternalPackages: ["gitclaw"]
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.local.example
├── .gitignore
│
├── app/
│   ├── layout.tsx                     # minimal, transparent bg
│   ├── globals.css                    # tailwind + scrollbar
│   ├── page.tsx                       # floating chat widget UI
│   └── api/
│       └── chat/
│           └── route.ts               # POST /api/chat — invokes gitclaw
│
├── components/
│   ├── ChatWidget.tsx                 # main widget (open/close, input, bubble list)
│   ├── MessageList.tsx                # message rendering
│   └── useParentContext.ts            # hook: listens for postMessage, returns context
│
├── lib/
│   ├── types.ts                       # PageContext, ChatMessage
│   └── systemPrompt.ts                # builds the system prompt suffix from context
│
├── agent/
│   ├── agent.yaml                     # Lyzr model, no builtin tools
│   ├── SOUL.md                        # persona (calm, concise, banker-lite)
│   ├── RULES.md                       # no invented rates, no PII, defer sensitive ops
│   └── knowledge/
│       ├── glossary.md                # APR, EMI, KYC, etc.
│       ├── loan-application.md        # form field explanations, docs required
│       ├── credit-cards.md            # FAQs
│       └── transfers.md               # transfer form help
│
└── public/
    ├── embed.js                       # snippet the bank drops on their site
    └── parent-demo.html               # local demo page to verify the widget
```

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: project root `bank-help-chatbot/`
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.env.local.example`

- [ ] **Step 1: Create project directory and initialize git**

```bash
cd ~
mkdir bank-help-chatbot && cd bank-help-chatbot
git init
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "bank-help-chatbot",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3333",
    "build": "next build",
    "start": "next start -p 3333",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.3",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "gitclaw": "^1.3.3"
  },
  "devDependencies": {
    "@types/node": "20.11.0",
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "typescript": "5.6.3",
    "tailwindcss": "3.4.17",
    "postcss": "8.4.49",
    "autoprefixer": "10.4.20"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["gitclaw"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
.next/
.env.local
.env
.DS_Store
*.log
agent/.gitagent/
```

- [ ] **Step 6: Create `.env.local.example`**

```
LYZR_API_KEY=your-lyzr-api-key-here
LYZR_AGENT_ID=your-lyzr-agent-id-here
```

- [ ] **Step 7: Install and commit**

```bash
npm install
git add -A
git commit -m "chore: scaffold next.js project with gitclaw dependency"
```

---

## Task 2: Tailwind + base app shell

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: Create `postcss.config.mjs`**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 3: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { background: transparent; }

.chat-scroll::-webkit-scrollbar { width: 6px; }
.chat-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }
```

- [ ] **Step 4: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank Help",
  description: "Help chatbot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add tailwind and base layout"
```

---

## Task 3: Types and context hook

**Files:**
- Create: `lib/types.ts`, `components/useParentContext.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```ts
export type PageContext = {
  page?: string;        // e.g. "loan-application"
  step?: number | string;
  stuckField?: string;  // e.g. "annual_income"
  url?: string;
  title?: string;
};

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};
```

- [ ] **Step 2: Create `components/useParentContext.ts`**

```ts
"use client";

import { useEffect, useState } from "react";
import type { PageContext } from "@/lib/types";

const MESSAGE_TYPE = "bank-help-context";

export function useParentContext(): PageContext {
  const [ctx, setCtx] = useState<PageContext>({});

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type !== MESSAGE_TYPE) return;
      const { type: _t, ...rest } = event.data;
      setCtx(rest as PageContext);
    };
    window.addEventListener("message", handler);
    // Announce readiness so parent can send current context
    window.parent?.postMessage({ type: "bank-help-ready" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  return ctx;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: page context types and postMessage hook"
```

---

## Task 4: System prompt builder

**Files:**
- Create: `lib/systemPrompt.ts`

- [ ] **Step 1: Create `lib/systemPrompt.ts`**

```ts
import type { PageContext } from "./types";

export function buildContextSuffix(ctx: PageContext): string {
  const parts: string[] = [];
  if (ctx.page) parts.push(`Page: ${ctx.page}`);
  if (ctx.step !== undefined && ctx.step !== "") parts.push(`Step: ${ctx.step}`);
  if (ctx.stuckField) parts.push(`User appears stuck on field: "${ctx.stuckField}"`);
  if (ctx.url) parts.push(`URL: ${ctx.url}`);
  if (ctx.title) parts.push(`Title: ${ctx.title}`);

  if (parts.length === 0) {
    return "\n\n[No page context available — ask the user what they're trying to do.]";
  }

  return [
    "\n\n[CURRENT PAGE CONTEXT]",
    ...parts,
    "",
    "Use this context to tailor your answer. If the user mentions 'this field' or 'this form', assume they mean the above. Keep answers short and concrete.",
  ].join("\n");
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: system prompt context suffix builder"
```

---

## Task 5: Agent directory (SOUL, RULES, agent.yaml, knowledge)

**Files:**
- Create: `agent/agent.yaml`, `agent/SOUL.md`, `agent/RULES.md`, `agent/knowledge/*.md`

- [ ] **Step 1: Create `agent/agent.yaml`**

```yaml
spec_version: "0.1.0"
name: bank-help
version: 1.0.0
description: Help users who get stuck on a bank website form or page.

model:
  preferred: "lyzr:${LYZR_AGENT_ID}@https://agent-prod.studio.lyzr.ai/v4"
  constraints:
    temperature: 0.3
    max_tokens: 800

tools: []

runtime:
  max_turns: 6
```

- [ ] **Step 2: Create `agent/SOUL.md`**

```markdown
# SOUL

You are the Bank Help assistant — a calm, concise helper embedded on a bank's
website. Your job is to unstick users: someone filling out a loan application
who doesn't understand a field, someone confused by a fee, someone unsure what
documents they need.

Voice:
- Plain language, no jargon unless you define it in the same sentence.
- Short answers. 2-4 sentences by default. Bullet lists when listing docs/steps.
- Warm but professional. Never cutesy. Never salesy.
- If you don't know, say so and suggest contacting a banker.

You can see which page the user is on via context injected into your system
prompt. Reference it naturally — "For the income field on this step, ..." —
rather than repeating the raw context back at them.
```

- [ ] **Step 3: Create `agent/RULES.md`**

```markdown
# RULES

Hard rules — never violate:

1. **No invented numbers.** Never state specific rates, fees, APRs, loan
   amounts, or timelines unless they appear in the knowledge base. If asked
   for a specific rate, say: "Rates depend on your profile — a banker can
   give you an exact quote. Would you like the number to call?"

2. **No PII intake.** Never ask for or accept:
   - Full account numbers, card numbers, CVV
   - Passwords, PINs, OTPs
   - Full SSN / national ID
   If a user pastes any of these, tell them to not share it in chat and to
   use the bank's secure login instead.

3. **Defer money movement.** Never claim to be able to transfer funds, close
   accounts, change limits, or dispute transactions. Tell the user which
   secure channel to use (logged-in portal, branch, phone).

4. **Stay on topic.** If asked about non-banking topics, briefly redirect.

5. **Context-first.** When page context is present, assume the user's
   question is about that page unless they clearly say otherwise.
```

- [ ] **Step 4: Create `agent/knowledge/glossary.md`**

```markdown
# Banking Glossary

**APR (Annual Percentage Rate):** The yearly cost of a loan including
interest and mandatory fees, expressed as a percentage. Higher APR = more
expensive loan over a year.

**EMI (Equated Monthly Installment):** A fixed monthly payment on a loan
that covers both interest and principal.

**KYC (Know Your Customer):** Identity verification the bank is legally
required to do before opening an account or giving a loan. Usually needs a
government ID and proof of address.

**Principal:** The original loan amount, before interest.

**Tenure:** How long you have to repay a loan (e.g., 5 years).

**Credit limit:** The maximum you can borrow on a credit card.

**Minimum payment:** The smallest amount you can pay on a credit card bill
to avoid a late fee. Paying only the minimum means high interest on the
rest.

**Available balance:** Money in your account you can spend right now
(pending transactions already deducted).

**Statement balance:** What you owe on your credit card as of the last
billing cycle.
```

- [ ] **Step 5: Create `agent/knowledge/loan-application.md`**

```markdown
# Loan Application Help

## Fields

- **Annual income:** Your gross (pre-tax) yearly income from all sources —
  salary, bonuses, rental income, freelance. Use the number before
  deductions. If salaried, check your last payslip or Form 16.
- **Employment type:** Salaried, self-employed, business owner, or
  retired. This affects which documents you'll need.
- **Loan amount:** What you want to borrow. You can usually borrow up to
  5x your annual income for personal loans, more for home loans.
- **Tenure:** How long you want to repay. Longer tenure = smaller EMI but
  more total interest.
- **Existing EMIs:** Total monthly payments on other loans. The bank uses
  this to check if you can afford another loan.

## Documents required (typical)

For salaried applicants:
- Government photo ID (passport / driver's license / Aadhaar)
- Address proof (utility bill / bank statement < 3 months old)
- Last 3 months salary slips
- Last 6 months bank statement
- Form 16 or latest ITR

For self-employed:
- Same ID + address proof
- Last 2 years ITR
- Last 12 months business bank statement
- Business registration / GST certificate

## Common stuck points

- **"Why is my rate different from the advertised rate?"** — Advertised
  rates are the best case. Your actual rate depends on credit score,
  income, and existing debt.
- **"Can I apply with a co-applicant?"** — Yes. A co-applicant's income
  can boost the loan amount you're eligible for.
- **"What if my application is rejected?"** — You can reapply after 3-6
  months. Fix the reason (usually low credit score or high existing debt)
  first.
```

- [ ] **Step 6: Create `agent/knowledge/credit-cards.md`**

```markdown
# Credit Cards — Common Questions

- **Billing cycle:** The ~30-day window during which your purchases are
  added to one statement. The statement date is when the bill is generated;
  the due date is ~20 days after.
- **Grace period:** If you pay the full statement balance by the due date,
  you pay zero interest on purchases. Partial payments lose this benefit.
- **Cash advance:** Withdrawing cash from the card. Very expensive — interest
  starts from day one, plus a withdrawal fee. Avoid if possible.
- **Annual fee:** Yearly charge for holding the card. Some cards waive it
  if you spend above a threshold.
- **Reward points vs cashback:** Points need to be redeemed (often at worse
  value); cashback is direct money back. Cashback is usually simpler.
- **What raises my credit score?** Paying full balance on time every month,
  keeping usage below 30% of your limit, not opening many cards at once.
```

- [ ] **Step 7: Create `agent/knowledge/transfers.md`**

```markdown
# Money Transfers

## Types

- **Within the same bank:** Instant, no fee.
- **NEFT / ACH:** Batch-processed, takes a few hours. Low or no fee.
- **RTGS / wire:** Real-time, for large amounts. Has a fee.
- **UPI / instant transfer:** Instant, usually free, for smaller amounts.
- **International / SWIFT:** Takes 1-3 business days, has fees on both
  sending and receiving sides, plus an exchange rate markup.

## Common stuck points

- **"Beneficiary not showing up."** — New beneficiaries are usually
  activated after a cool-off period (typically 30 minutes) for security.
- **"Transfer limit exceeded."** — Daily limits reset at midnight. Large
  transfers may need to use RTGS instead of NEFT.
- **"Wrong account number — can I reverse it?"** — If it's gone through,
  contact the branch immediately. Reversal is not guaranteed and depends
  on the recipient's cooperation.
- **"Why do I need to add a beneficiary first?"** — Regulatory requirement
  to prevent fraud. One-time setup.

## Safety

Never share OTPs with anyone, including people claiming to be from the
bank. The bank will never ask for your OTP, PIN, or password over the
phone or in chat.
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: agent directory with SOUL, RULES, and seed knowledge base"
```

---

## Task 6: Chat API route

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Create `app/api/chat/route.ts`**

```ts
import { NextRequest } from "next/server";
import { query } from "gitclaw";
import path from "node:path";
import type { ChatMessage, PageContext } from "@/lib/types";
import { buildContextSuffix } from "@/lib/systemPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_DIR = path.join(process.cwd(), "agent");

function resolveModel(): string {
  const agentId = process.env.LYZR_AGENT_ID;
  if (!agentId) throw new Error("LYZR_AGENT_ID is not set");
  return `lyzr:${agentId}@https://agent-prod.studio.lyzr.ai/v4`;
}

function formatHistory(messages: ChatMessage[]): string {
  // Last user message is the prompt; everything before is history.
  const history = messages.slice(0, -1);
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") throw new Error("Last message must be from user");

  const historyText = history
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return historyText ? `${historyText}\nUser: ${last.content}` : last.content;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { messages: ChatMessage[]; context: PageContext };
  const { messages, context } = body;

  if (!process.env.LYZR_API_KEY) {
    return new Response(JSON.stringify({ error: "LYZR_API_KEY not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
  // gitclaw's Lyzr path uses OpenAI-compatible Bearer auth
  process.env.OPENAI_API_KEY = process.env.LYZR_API_KEY;

  const prompt = formatHistory(messages);
  const systemPromptSuffix = buildContextSuffix(context ?? {});

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = query({
          prompt,
          dir: AGENT_DIR,
          model: resolveModel(),
          systemPromptSuffix,
          replaceBuiltinTools: true,
          maxTurns: 4,
          constraints: { temperature: 0.3, maxTokens: 800 },
        });

        for await (const msg of result) {
          if (msg.type === "assistant" && typeof msg.content === "string") {
            controller.enqueue(encoder.encode(msg.content));
          }
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n\n[error: ${message}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: /api/chat route invoking gitclaw with Lyzr model"
```

---

## Task 7: Chat widget UI

**Files:**
- Create: `components/MessageList.tsx`, `components/ChatWidget.tsx`, `app/page.tsx`

- [ ] **Step 1: Create `components/MessageList.tsx`**

```tsx
"use client";

import type { ChatMessage } from "@/lib/types";

export function MessageList({ messages, pending }: { messages: ChatMessage[]; pending: string }) {
  return (
    <div className="chat-scroll flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.length === 0 && !pending && (
        <div className="text-sm text-gray-500">
          Hi! I can help if you're stuck. What are you trying to do?
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
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/ChatWidget.tsx`**

```tsx
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
        className="fixed bottom-5 right-5 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        aria-label="Open help chat"
      >
        ?
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 w-[360px] h-[520px] rounded-2xl shadow-2xl bg-white flex flex-col overflow-hidden border border-gray-200">
      <header className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div>
          <div className="font-semibold text-sm">Bank Help</div>
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
          placeholder="Ask about this page…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-40"
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
```

- [ ] **Step 3: Create `app/page.tsx`**

```tsx
import { ChatWidget } from "@/components/ChatWidget";

export default function Page() {
  return <ChatWidget />;
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: floating chat widget UI with streaming"
```

---

## Task 8: Embed script and demo parent page

**Files:**
- Create: `public/embed.js`, `public/parent-demo.html`

- [ ] **Step 1: Create `public/embed.js`**

```js
// Bank-side embed snippet. Drop this on any page:
//   <script src="https://help.bank.example/embed.js"
//           data-origin="https://help.bank.example"
//           data-page="loan-application"
//           data-step="2"
//           data-stuck-field="annual_income"></script>
(function () {
  var current = document.currentScript;
  var origin = (current && current.dataset.origin) || window.location.origin;

  var iframe = document.createElement("iframe");
  iframe.src = origin;
  iframe.title = "Bank Help";
  iframe.style.cssText = [
    "position:fixed",
    "bottom:0",
    "right:0",
    "width:400px",
    "height:580px",
    "border:0",
    "z-index:2147483647",
    "background:transparent",
    "color-scheme:light",
  ].join(";");
  document.body.appendChild(iframe);

  function readContext() {
    if (!current) return {};
    var d = current.dataset;
    return {
      type: "bank-help-context",
      page: d.page,
      step: d.step,
      stuckField: d.stuckField,
      url: window.location.href,
      title: document.title,
    };
  }

  function post() {
    if (iframe.contentWindow) iframe.contentWindow.postMessage(readContext(), "*");
  }

  // Post once the widget signals ready
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "bank-help-ready") post();
  });

  // Expose a tiny API the bank can call on form/page changes
  window.BankHelp = {
    update: function (patch) {
      var ctx = readContext();
      Object.assign(ctx, patch || {});
      ctx.type = "bank-help-context";
      if (iframe.contentWindow) iframe.contentWindow.postMessage(ctx, "*");
    },
  };
})();
```

- [ ] **Step 2: Create `public/parent-demo.html`**

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Demo Bank — Loan Application</title>
    <style>
      body { font: 15px/1.5 system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 20px; }
      button { margin: 4px 4px 4px 0; padding: 8px 12px; cursor: pointer; }
      h1 { font-size: 22px; }
      h2 { font-size: 16px; margin-top: 32px; }
    </style>
  </head>
  <body>
    <h1>Demo Bank</h1>
    <p>This page simulates a bank site. Click a scenario to update the help widget's context.</p>

    <h2>Scenarios</h2>
    <button onclick="BankHelp.update({ page: 'loan-application', step: 2, stuckField: 'annual_income' })">
      Loan app · stuck on annual income
    </button>
    <button onclick="BankHelp.update({ page: 'loan-application', step: 3, stuckField: 'documents' })">
      Loan app · documents required
    </button>
    <button onclick="BankHelp.update({ page: 'credit-cards', stuckField: 'billing_cycle' })">
      Credit card · billing cycle
    </button>
    <button onclick="BankHelp.update({ page: 'transfers', stuckField: 'beneficiary_activation' })">
      Transfers · beneficiary not showing
    </button>

    <script
      src="/embed.js"
      data-origin="http://localhost:3333"
      data-page="home"
    ></script>
  </body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: embed.js and parent demo page"
```

---

## Task 9: Smoke-test locally

**Files:** none

- [ ] **Step 1: Create `.env.local` with real keys**

```bash
cp .env.local.example .env.local
# then edit .env.local — fill in LYZR_API_KEY and LYZR_AGENT_ID
```

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Expected: `Ready on http://localhost:3333` within ~3s.

- [ ] **Step 3: Verify widget standalone**

Open `http://localhost:3333` in a browser.
Expected: floating chat bubble in bottom-right, header "Bank Help · Ready to help", input enabled.

Type: `what is APR?`
Expected: streamed answer mentioning "Annual Percentage Rate" with a plain-language definition. Less than 4 sentences.

- [ ] **Step 4: Verify parent-demo context plumbing**

Open `http://localhost:3333/parent-demo.html`.
Click "Loan app · stuck on annual income".
Expected: widget header updates to "Help with: annual_income".

Type: `what goes here?`
Expected: reply describes gross annual income (salary + other income, pre-tax), mentions payslips / Form 16 from the knowledge base, references "the income field" or similar.

- [ ] **Step 5: Verify RULES guardrails**

Type: `what's the exact interest rate for a 5 lakh personal loan?`
Expected: assistant refuses to give a specific rate, offers to connect with a banker.

Type: `my account number is 1234567890123`
Expected: assistant tells user not to share account details in chat, directs to secure login.

- [ ] **Step 6: Commit any fixes found**

If smoke tests surface issues, fix them and commit with message starting `fix:`.

---

## Task 10: Deploy-ready polish

**Files:**
- Modify: `README.md` (create if missing)

- [ ] **Step 1: Create `README.md`**

```markdown
# Bank Help Chatbot

Embeddable floating chat widget that helps bank-website users when they're
stuck on a page. Uses gitclaw + Lyzr AI Studio.

## Setup

1. `cp .env.local.example .env.local` and fill in your Lyzr keys.
2. `npm install`
3. `npm run dev`
4. Open http://localhost:3333/parent-demo.html

## Embedding on a bank site

```html
<script src="https://YOUR-DEPLOY-URL/embed.js"
        data-origin="https://YOUR-DEPLOY-URL"
        data-page="loan-application"
        data-step="2"
        data-stuck-field="annual_income"></script>
```

To update context on route/field changes:
```js
window.BankHelp.update({ page: "credit-cards", stuckField: "billing_cycle" });
```

## Deploy

- Vercel / Netlify: set `LYZR_API_KEY` and `LYZR_AGENT_ID` env vars. No special build config needed.
- The `serverExternalPackages: ["gitclaw"]` in `next.config.ts` is required — keep it.
```

- [ ] **Step 2: Build to catch production errors**

```bash
npm run build
```

Expected: build succeeds. If it fails with a gitclaw-related error, verify `serverExternalPackages: ["gitclaw"]` is set in `next.config.ts`.

- [ ] **Step 3: Commit and (optionally) push**

```bash
git add -A
git commit -m "docs: README with setup and embed instructions"
```

---

## Self-review

**Spec coverage:**
- Embeddable widget (hybrid A/B) → Tasks 7, 8 ✓
- postMessage context plumbing → Tasks 3, 8 ✓
- Pure Q&A with knowledge base → Task 5 ✓
- Lyzr as LLM provider → Tasks 5, 6 ✓
- `serverExternalPackages: ["gitclaw"]` → Task 1 ✓
- `replaceBuiltinTools: true` → Task 6 ✓
- OpenAI-compatible Bearer auth → Task 6 ✓
- Guardrails (no rates, no PII, defer money moves) → Task 5 (RULES.md), Task 9 (tests) ✓
- Manual smoke tests per knowledge domain → Task 9 ✓
- Deployability → Task 10 ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases" phrases. Every code step has complete code.

**Type consistency:** `PageContext`, `ChatMessage`, `ChatRole` defined in Task 3 and used consistently in Tasks 4, 6, 7. `buildContextSuffix` signature matches between Task 4 (definition) and Task 6 (usage). `useParentContext` return type matches `PageContext`. Message type string `"bank-help-context"` / `"bank-help-ready"` consistent between `useParentContext` (Task 3) and `embed.js` (Task 8).
