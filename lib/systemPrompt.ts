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
