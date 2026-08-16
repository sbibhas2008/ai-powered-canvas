import { describe, it, expect } from "vitest";
import { agentRequestSchema } from "./schema";

const message = { role: "user" as const, parts: [{ type: "text", text: "hi" }] };

function body(overrides: Record<string, unknown> = {}) {
  return { roomId: "default-room", messages: [message], ...overrides };
}

describe("agentRequestSchema", () => {
  it("accepts a realistic request", () => {
    expect(agentRequestSchema.safeParse(body()).success).toBe(true);
  });

  it("strips the extra keys the AI SDK sends rather than rejecting them", () => {
    const parsed = agentRequestSchema.parse(
      body({ id: "chat-1", trigger: "submit-message", messageId: "m1" }),
    );

    expect(parsed).toEqual({ roomId: "default-room", messages: [message] });
  });

  it("accepts the system role", () => {
    const parsed = agentRequestSchema.safeParse(
      body({ messages: [{ role: "system", parts: [{ type: "text", text: "x" }] }] }),
    );

    expect(parsed.success).toBe(true);
  });

  it("accepts a legacy message carrying content instead of parts", () => {
    const parsed = agentRequestSchema.safeParse(
      body({ messages: [{ role: "user", content: "hi" }] }),
    );

    expect(parsed.success).toBe(true);
  });

  it("rejects a missing roomId", () => {
    expect(agentRequestSchema.safeParse({ messages: [message] }).success).toBe(
      false,
    );
  });

  it.each(["../evil", "UPPER", "", "rooms/evil"])(
    "rejects roomId %j",
    (roomId) => {
      expect(agentRequestSchema.safeParse(body({ roomId })).success).toBe(false);
    },
  );

  it("rejects an empty messages array", () => {
    expect(agentRequestSchema.safeParse(body({ messages: [] })).success).toBe(
      false,
    );
  });

  it("rejects an unknown role", () => {
    const parsed = agentRequestSchema.safeParse(
      body({ messages: [{ role: "tool", content: "x" }] }),
    );

    expect(parsed.success).toBe(false);
  });

  it("reports the offending field so the 400 is actionable", () => {
    const parsed = agentRequestSchema.safeParse(body({ roomId: "../evil" }));

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toEqual(["roomId"]);
    }
  });
});
