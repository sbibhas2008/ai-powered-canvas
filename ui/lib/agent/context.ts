import type { ToolRuntime } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Per-invocation context injected by the server, never supplied by the model.
 *
 * `roomId` lives here rather than in the tool schemas because it becomes the
 * Hocuspocus document name verbatim — a hallucinated value would write to an
 * arbitrary document.
 */
export const agentContextSchema = z.object({
  roomId: z.string(),
});

export type AgentContext = z.infer<typeof agentContextSchema>;

export type AgentToolRuntime = ToolRuntime<unknown, AgentContext>;

/**
 * Unreachable when the wiring is correct: the API route rejects a request
 * without a valid room, and `agentContextSchema` requires it. Throwing rather
 * than defaulting is deliberate — silently picking a room is the exact failure
 * this indirection removes.
 */
export function requireRoomId(runtime: AgentToolRuntime): string {
  const roomId = runtime?.context?.roomId;

  if (!roomId) {
    throw new Error("Agent context is missing roomId");
  }

  return roomId;
}
