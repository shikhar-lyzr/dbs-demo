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
