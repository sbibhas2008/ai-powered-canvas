import { RateLimitService } from "@/lib/agent/rateLimit";
import { streamAgentResponse } from "@/lib/agent/stream";
import { getIp, parseJsonBody } from "@/lib/api/request";
import { badRequest, rateLimited, serverError } from "@/lib/api/errors";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createUIMessageStreamResponse } from "ai";

const rateLimiter = new RateLimitService({ cooldownMs: 5_000 });

interface UIMessage {
  role: "user" | "assistant";
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
}

function toLangChainMessages(messages: UIMessage[]) {
  return messages.map((m) => {
    const text =
      m.parts
        ?.filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join("") ?? m.content ?? "";
    return m.role === "user" ? new HumanMessage(text) : new AIMessage(text);
  });
}

function validateMessages(body: unknown): UIMessage[] | null {
  const { messages } = body as { messages: UIMessage[] };
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return null;
  return messages;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const ip = getIp(request);

    if (rateLimiter.isRateLimited(ip)) {
      return rateLimited();
    }

    const body = await parseJsonBody(request);
    const messages = validateMessages(body);
    if (!messages) {
      console.log(`[api] validation failed: invalid messages`);
      return badRequest("messages array is required");
    }

    console.log(`[api] valid request: ${messages.length} messages`);

    const stream = await streamAgentResponse(toLangChainMessages(messages));
    const duration = Date.now() - startTime;
    console.log(`[api] stream created in ${duration}ms`);
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[api] error after ${duration}ms:`, error);
    return serverError();
  }
}
