import { NextRequest } from "next/server";
import { query } from "gitclaw";
import path from "node:path";
import type { ChatMessage, PageContext } from "@/lib/types";
import { buildContextSuffix } from "@/lib/systemPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import fs from "node:fs";

function findBundledAgentDir(): string {
  const candidates = [
    path.join(process.cwd(), "agent"),
    path.join(process.cwd(), ".next", "server", "agent"),
    path.resolve(__dirname ?? ".", "../../../agent"),
    path.resolve(__dirname ?? ".", "../../../../agent"),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(path.join(c, "agent.yaml"))) return c;
    } catch {}
  }
  return candidates[0];
}

// Netlify/Lambda filesystem is read-only except /tmp. gitclaw mkdirs
// <agentDir>/.gitagent on load, so copy the bundled read-only agent/ to
// /tmp/agent once per cold start and use that.
function prepareAgentDir(): string {
  const bundled = findBundledAgentDir();
  const writableRoot = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? "/tmp"
    : null;
  if (!writableRoot) return bundled;
  const dest = path.join(writableRoot, "agent");
  try {
    if (!fs.existsSync(path.join(dest, "agent.yaml"))) {
      fs.cpSync(bundled, dest, { recursive: true });
    }
    return dest;
  } catch {
    return bundled;
  }
}
const AGENT_DIR = prepareAgentDir();

function resolveModel(): string {
  const agentId = process.env.LYZR_AGENT_ID;
  if (!agentId) throw new Error("LYZR_AGENT_ID is not set");
  return `lyzr:${agentId}@https://agent-prod.studio.lyzr.ai/v4`;
}

function formatHistory(messages: ChatMessage[]): string {
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
  process.env.OPENAI_API_KEY = process.env.LYZR_API_KEY;

  const prompt = formatHistory(messages);
  const systemPromptSuffix = buildContextSuffix(context ?? {});

  const debugMode = req.nextUrl.searchParams.get("debug") === "1";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let produced = 0;
      const trace: string[] = [];
      const log = (s: string) => {
        try { console.log("[chat]", s); } catch {}
        trace.push(s);
      };
      log(`cwd=${process.cwd()} agentDir=${AGENT_DIR} hasAgentYaml=${fs.existsSync(path.join(AGENT_DIR, "agent.yaml"))} hasLyzrKey=${!!process.env.LYZR_API_KEY} hasLyzrAgent=${!!process.env.LYZR_AGENT_ID}`);
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
          const m = msg as { type: string; subtype?: string; content?: unknown; errorMessage?: string; stopReason?: string };
          log(`msg type=${m.type}${m.subtype ? ` subtype=${m.subtype}` : ""}${m.stopReason ? ` stop=${m.stopReason}` : ""}${m.errorMessage ? ` err=${m.errorMessage}` : ""} contentLen=${typeof m.content === "string" ? m.content.length : "n/a"}`);

          if (m.type === "assistant" && typeof m.content === "string" && m.content.length > 0) {
            produced += m.content.length;
            controller.enqueue(encoder.encode(m.content));
          }
          // Surface gitclaw error system messages to the client so we can see them.
          if (m.type === "system" && m.subtype === "error" && typeof m.content === "string") {
            controller.enqueue(encoder.encode(`\n[agent-error: ${m.content}]`));
          }
        }
        if (produced === 0) {
          const diag = `[no assistant output. trace:\n${trace.join("\n")}\n]`;
          log("done with zero assistant output");
          controller.enqueue(encoder.encode(diag));
        } else if (debugMode) {
          controller.enqueue(encoder.encode(`\n\n[trace:\n${trace.join("\n")}\n]`));
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? (err.stack || err.message) : String(err);
        log(`THROW ${message}`);
        controller.enqueue(encoder.encode(`\n\n[throw: ${message}]\n[trace:\n${trace.join("\n")}\n]`));
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
