import type { BaseMessage } from "@langchain/core/messages";
import { createUIMessageStream } from "ai";
import { getAgent } from "./agent";

export function streamAgentResponse(messages: BaseMessage[], roomId: string) {
  const agent = getAgent();

  return createUIMessageStream({
    execute: async ({ writer }) => {
      const events = agent.streamEvents(
        { messages },
        { version: "v2", context: { roomId } },
      );

      let textStarted = false;

      for await (const event of events) {
        if (event.event !== "on_chat_model_stream") continue;

        const token = event.data?.chunk?.content;
        if (typeof token !== "string" || token.length === 0) continue;

        if (!textStarted) {
          writer.write({ type: "text-start", id: "text-0" });
          textStarted = true;
        }
        writer.write({ type: "text-delta", id: "text-0", delta: token });
      }

      if (textStarted) {
        writer.write({ type: "text-end", id: "text-0" });
      }
    },
  });
}
