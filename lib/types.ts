export type PageContext = {
  page?: string;
  step?: number | string;
  stuckField?: string;
  url?: string;
  title?: string;
};

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};
