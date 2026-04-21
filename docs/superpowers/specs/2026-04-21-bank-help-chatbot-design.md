# Bank Help Chatbot — Design Spec

**Date:** 2026-04-21
**Timeline:** ~2 hours
**Owner:** Shikhar

## Problem

A bank wants a chatbot embedded on their website that knows what page the user is on and helps when they get stuck (e.g., confused by a form field, unsure what a term means, unclear what documents are required).

## Scope (agreed via brainstorming)

- **Deployment:** Hybrid embeddable/standalone — a small Next.js app that renders a floating chat widget, served over an `<iframe>` the bank embeds on their site.
- **Page awareness:** Parent page sends a structured context blob via `postMessage` (`{page, step, stuckField, url}`). ~10 lines of JS on the bank side.
- **Agent behavior:** Pure Q&A backed by a knowledge base (`knowledge/*.md`). No live account lookup, no guided DOM actions, no voice.

## Out of scope (YAGNI for 2-hour build)

Voice, camera, memory persistence across sessions, scheduled tasks, hooks, plugins, skills marketplace, compliance audit logging, account lookup / bank API integration, authenticated user flows.

## Architecture

```
Bank site  ──<iframe src="https://help.bank.example">──▶  Next.js app
   │                                                        │
   └─postMessage({page, step, stuckField, url})──▶ widget state
                                                           │
                                                           ▼
                                            POST /api/chat {messages, context}
                                                           │
                                                           ▼
                                          gitclaw query({ model: "lyzr:<id>@..." })
                                                           │
                                                           ▼
                                          streamed reply ──▶ widget
```

**Components:**
1. **Embed snippet** (bank-side, ~15 lines JS) — injects iframe, posts context on route changes.
2. **Widget page** (`app/page.tsx`) — floating chat UI, listens for postMessage, streams replies.
3. **Chat API route** (`app/api/chat/route.ts`) — injects context as `systemPromptSuffix`, calls `gitclaw.query()`.
4. **Agent directory** (`agent/`) — `agent.yaml`, `SOUL.md`, `RULES.md`, `knowledge/*.md`.

## Load-bearing constraints (from `reference_gitclaw_sdk.md`)

- `next.config.ts` must set `serverExternalPackages: ["gitclaw"]`.
- `query()` call must set `replaceBuiltinTools: true` (no cli/read/write/memory — unused and drag in baileys/jimp).
- Lyzr auth is OpenAI-compatible Bearer: set `process.env.OPENAI_API_KEY = process.env.LYZR_API_KEY` before the query call.
- Model string format: `lyzr:<agent-id>@https://agent-prod.studio.lyzr.ai/v4`.

## Tone / guardrails (RULES.md)

- Never invent rates, fees, or product terms — if unknown, say "I'd need to connect you with a banker."
- Never ask for or accept full account numbers, card numbers, passwords, OTPs, or SSN in chat.
- For anything involving money movement or account changes, defer to human agent / secure channels.
- Keep answers short and plain-language; banking users skew non-technical.

## Testing (manual, pragmatic)

- `public/parent-demo.html` with buttons that post fake contexts (loan application step 2, credit card FAQ, transfer form). Verify the assistant's reply references injected context.
- One happy-path check per knowledge domain file.
- Browser test: load the demo, click each button, chat, verify streaming + context-awareness.

## Success criteria

- Bank can embed the widget with a single `<script>` snippet.
- Widget reflects current page context within 500ms of navigation.
- Agent answers at least 3 seed scenarios correctly: "what's APR?", "what docs do I need for a home loan?", "I'm stuck on the income field".
- Deployable to Vercel/Netlify with env vars set.
