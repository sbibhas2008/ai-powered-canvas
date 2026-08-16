import { describe, it, expect } from "vitest";
import { DEFAULT_ROOM_ID, isValidRoomId } from "./room";

describe("isValidRoomId", () => {
  it("accepts the default room", () => {
    expect(isValidRoomId(DEFAULT_ROOM_ID)).toBe(true);
  });

  it("accepts lowercase alphanumerics, dashes and underscores", () => {
    expect(isValidRoomId("room1")).toBe(true);
    expect(isValidRoomId("my_room-2")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidRoomId("")).toBe(false);
  });

  it("rejects path traversal shapes", () => {
    expect(isValidRoomId("../evil")).toBe(false);
    expect(isValidRoomId("rooms/evil")).toBe(false);
  });

  it("rejects uppercase", () => {
    expect(isValidRoomId("UPPER")).toBe(false);
  });

  it("rejects a leading dash or underscore", () => {
    expect(isValidRoomId("-room")).toBe(false);
    expect(isValidRoomId("_room")).toBe(false);
  });

  it("rejects ids longer than 64 characters", () => {
    expect(isValidRoomId("a".repeat(64))).toBe(true);
    expect(isValidRoomId("a".repeat(65))).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isValidRoomId(undefined)).toBe(false);
    expect(isValidRoomId(null)).toBe(false);
    expect(isValidRoomId(42)).toBe(false);
    expect(isValidRoomId({ roomId: "default-room" })).toBe(false);
  });
});
