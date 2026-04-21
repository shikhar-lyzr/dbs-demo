# DBS Savings Account Onboarding — Help Chatbot

An embeddable floating chat widget that helps users who get stuck while opening a DBS savings account via the digibank app. Built on [gitclaw](https://www.npmjs.com/package/gitclaw) with [Lyzr AI Studio](https://studio.lyzr.ai) as the LLM provider.

The agent knows the 20-step digiSavings onboarding journey screen-by-screen. When the parent page sends `{page, step, stuckField}` via `postMessage`, the agent tailors its answer to exactly where the user is stuck.

## Quick start

```bash
cp .env.local.example .env.local   # fill in LYZR_API_KEY and LYZR_AGENT_ID
npm install --legacy-peer-deps
npm run dev                         # starts on http://localhost:3333
```

Then open either:

- **`http://localhost:3333/demo/index.html`** — full 20-screen DBS digibank walkthrough with the widget embedded. Toggle phone-frame vs. full-screen from the top bar. Best for demos.
- **`http://localhost:3333/parent-demo.html`** — minimal scenario-button demo. Click buttons to push different `{page, step, stuckField}` contexts into the widget.
- **`http://localhost:3333`** — the widget standalone on a blank page (what bank sites iframe into).

## Architecture

```
Parent page (bank site)  ──postMessage──▶  iframe (this app)
                          {page, step,           │
                           stuckField}           ▼
                                          /api/chat POST
                                                 │
                                                 ▼
                                     gitclaw.query({
                                       dir: agent/,
                                       model: lyzr:<agent-id>@...,
                                       systemPromptSuffix: <page context>,
                                       replaceBuiltinTools: true
                                     })
                                                 │
                                                 ▼
                                       Lyzr AI Studio (OpenAI-compatible)
                                                 │
                                                 ▼
                                       Streamed response back to widget
```

- **`agent/`** — gitclaw agent definition: `agent.yaml`, `SOUL.md`, `RULES.md`, `knowledge/*.md` + `knowledge/index.yaml`.
- **`agent/knowledge/`** — six markdown files, all `always_load: true` so gitclaw inlines them into the system prompt (required because `replaceBuiltinTools: true` disables the `read` tool).
- **`app/api/chat/route.ts`** — Next.js Route Handler; copies `LYZR_API_KEY` → `OPENAI_API_KEY` at request time (Lyzr's endpoint is OpenAI-compatible), invokes `gitclaw.query`, streams plain-text chunks back.
- **`components/ChatWidget.tsx`** — floating widget UI. Subscribes to `postMessage` via `useParentContext` and sends context with each chat request.
- **`public/embed.js`** — drop-in embed script for bank sites. Creates the iframe, relays context via `postMessage`, exposes `window.BankHelp.update(patch)`.
- **`public/demo/`** — 20-screen mockup of the real DBS onboarding flow (login → carousel → registration → PAN → Aadhaar → OTP → KYC picks → account → fees → T&C → verification). For sales demos and e2e testing.

## Embedding on a real bank page

```html
<script
  src="https://YOUR-DEPLOY-URL/embed.js"
  data-origin="https://YOUR-DEPLOY-URL"
  data-page="onboarding-aadhaar"
  data-step="8"
  data-stuck-field="aadhaar_virtual_id"
></script>
```

Update context when the user navigates or focuses a new field:

```js
window.BankHelp.update({
  page: "onboarding-fees-note",
  step: 17,
  stuckField: "trv",
});
```

## Message protocol

| Direction | Type | Payload |
|---|---|---|
| Parent → iframe | `"bank-help-context"` | `{ page?, step?, stuckField?, url?, title? }` |
| Iframe → parent | `"bank-help-ready"` | `{}` — announced once on load so the parent can push current context |

## Guardrails (`agent/RULES.md`)

The agent refuses to:
- State interest rates, fees, or timelines not in the knowledge base (defers to in-app Schedule of Charges)
- Accept PAN, Aadhaar, OTP, passwords, or account numbers pasted into the chat (redirects the user to type them into the app field)
- Invent account-activation timelines, delivery windows, or ATM withdrawal limits

Everything in `agent/knowledge/products-and-fees.md` is verbatim from the actual DBS app screens — no made-up numbers.

## Deploy

Works on Vercel or Netlify out of the box:

- Set `LYZR_API_KEY` and `LYZR_AGENT_ID` as environment variables.
- Keep `serverExternalPackages: ["gitclaw"]` in `next.config.ts` — required because gitclaw is a Node-only package.
- The embed headers (`X-Frame-Options: ALLOWALL`, `Content-Security-Policy: frame-ancestors *`) in `next.config.ts` let bank sites iframe the widget from any origin. Tighten these before production if the set of parent origins is known.

## Development notes

- Dev server runs on port **3333** (`npm run dev`). Port chosen to avoid clashes with common 3000 usage.
- `--legacy-peer-deps` is required on `npm install` because Next 15.0.3's React peer range doesn't include stable React 19.
- gitclaw v1.3+ is required. Earlier versions don't support `replaceBuiltinTools` or the Lyzr model string format.

## Project structure

```
bank-help-chatbot/
├── agent/
│   ├── agent.yaml
│   ├── SOUL.md                      # onboarding-assistant persona
│   ├── RULES.md                     # no-invented-numbers, no-PII-in-chat
│   └── knowledge/
│       ├── index.yaml               # registry, all entries always_load: true
│       ├── onboarding-journey.md    # the 20 steps verbatim
│       ├── onboarding-stuck-points.md
│       ├── products-and-fees.md
│       ├── kyc-and-documents.md
│       ├── glossary.md
│       └── complaints.md
├── app/
│   ├── api/chat/route.ts            # POST /api/chat — gitclaw + Lyzr + stream
│   ├── layout.tsx
│   ├── page.tsx                     # renders <ChatWidget />
│   └── globals.css
├── components/
│   ├── ChatWidget.tsx
│   ├── MessageList.tsx
│   └── useParentContext.ts
├── lib/
│   ├── types.ts                     # PageContext, ChatMessage
│   └── systemPrompt.ts              # buildContextSuffix()
├── public/
│   ├── embed.js                     # bank-side drop-in script
│   ├── parent-demo.html             # quick scenario-button demo
│   └── demo/                        # full 20-screen walkthrough
└── next.config.ts                   # serverExternalPackages + iframe headers
```
