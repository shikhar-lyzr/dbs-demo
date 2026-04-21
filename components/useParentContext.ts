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
    window.parent?.postMessage({ type: "bank-help-ready" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  return ctx;
}
