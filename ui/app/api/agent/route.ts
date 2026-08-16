import { RateLimitService } from "@/lib/agent/rateLimit";
import { streamAgentResponse } from "@/lib/agent/stream";
import { getIp, parseRequestBody } from "@/lib/api/request";
import { rateLimited, toErrorResponse } from "@/lib/api/errors";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createUIMessageStreamResponse } from "ai";
import { agentRequestSchema, type AgentRequestMessage } from "./schema";

const rateLimiter = new RateLimitService({ cooldownMs: 5_000 });

function toLangChainMessages(messages: AgentRequestMessage[]) {
  return messages.map((m) => {
    const text =
      m.parts
        ?.filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join("") ?? m.content ?? "";
    return m.role === "user" ? new HumanMessage(text) : new AIMessage(text);
  });
}

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const ip = getIp(request);

    if (rateLimiter.isRateLimited(ip)) {
      return rateLimited();
    }

    const { messages, roomId } = await parseRequestBody(
      request,
      agentRequestSchema,
    );

    console.log(
      `[api] valid request: ${messages.length} messages room=${roomId}`,
    );

    const stream = await streamAgentResponse(
      toLangChainMessages(messages),
      roomId,
    );
    const duration = Date.now() - startTime;
    console.log(`[api] stream created in ${duration}ms`);
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.log(`[api] failed after ${Date.now() - startTime}ms`);
    return toErrorResponse(error);
  }
}
