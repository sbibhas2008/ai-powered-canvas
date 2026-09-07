export const DEFAULT_ROOM_ID = "default-room";

/**
 * The room id is used as-is to name the shared document, so we check it before
 * passing it on. Lowercase letters, numbers, dashes and underscores only —
 * that keeps out odd values like "../other-room".
 */
const ROOM_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function isValidRoomId(value: unknown): value is string {
  return typeof value === "string" && ROOM_ID_PATTERN.test(value);
}
