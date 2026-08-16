import { z } from "zod";
import { isValidRoomId } from "@/lib/sync/room";

/** Wire format for POST /api/agent. roomId is format-checked, not authorized. */
export const agentRequestSchema = z.object({
  roomId: z.string().refine(isValidRoomId, { message: "invalid roomId" }),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        parts: z
          .array(z.object({ type: z.string(), text: z.string().optional() }))
          .optional(),
        content: z.string().optional(),
      }),
    )
    .min(1),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type AgentRequestMessage = AgentRequest["messages"][number];
