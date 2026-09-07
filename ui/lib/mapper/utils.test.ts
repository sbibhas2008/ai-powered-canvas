import { describe, it, expect } from "vitest";
import { stableHash } from "./utils";

describe("stableHash", () => {
  it("is deterministic — same input produces same output", () => {
    const a = stableHash("hello");
    const b = stableHash("hello");

    expect(a).toBe(b);
  });

  it("produces different outputs for different inputs", () => {
    const a = stableHash("hello");
    const b = stableHash("world");

    expect(a).not.toBe(b);
  });

  it("returns a non-negative integer", () => {
    const result = stableHash("test-string");

    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("handles empty string", () => {
    const result = stableHash("");

    expect(result).toBe(0);
  });

  it("produces consistent results across calls", () => {
    const inputs = ["rect1", "arrow1", "edge-abc", "", "a"];

    for (const input of inputs) {
      const first = stableHash(input);
      const second = stableHash(input);

      expect(first).toBe(second);
    }
  });

  it("returns unsigned 32-bit values (no negative numbers)", () => {
    const inputs = [
      "\xff\xff\xff\xff",
      "\x00\x00\x00\x01",
      "negative-test-string",
    ];

    for (const input of inputs) {
      const result = stableHash(input);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(0xffffffff);
    }
  });
});
