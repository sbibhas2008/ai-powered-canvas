import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { getIp, parseRequestBody } from "./request";
import { BadRequestError } from "./errors";

const schema = z.object({ name: z.string(), count: z.number().min(1) });

function post(body: string): Request {
  return new Request("http://localhost/api/thing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseRequestBody", () => {
  it("returns typed data for a valid body", async () => {
    await expect(
      parseRequestBody(post(JSON.stringify({ name: "a", count: 2 })), schema),
    ).resolves.toEqual({ name: "a", count: 2 });
  });

  it("strips unknown keys rather than rejecting", async () => {
    const data = await parseRequestBody(
      post(JSON.stringify({ name: "a", count: 2, extra: "x" })),
      schema,
    );

    expect(data).not.toHaveProperty("extra");
  });

  it("throws BadRequestError for malformed JSON", async () => {
    await expect(
      parseRequestBody(post("not json"), schema),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("throws BadRequestError for a schema violation", async () => {
    await expect(
      parseRequestBody(post(JSON.stringify({ name: "a", count: 0 })), schema),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("never reveals which field failed to the caller", async () => {
    const nested = z.object({ secretField: z.string() });

    await expect(
      parseRequestBody(post(JSON.stringify({ secretField: 1 })), nested),
    ).rejects.toThrow("Bad request");
  });

  it("keeps the failing field in the server log", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await expect(
      parseRequestBody(post(JSON.stringify({ name: "a", count: 0 })), schema),
    ).rejects.toThrow();

    expect(log).toHaveBeenCalledWith(
      "[api] rejected body:",
      expect.arrayContaining([expect.objectContaining({ path: ["count"] })]),
    );
  });
});

describe("getIp", () => {
  it("reads x-forwarded-for", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    expect(getIp(request)).toBe("10.0.0.1");
  });

  it("falls back to unknown", () => {
    expect(getIp(new Request("http://localhost/"))).toBe("unknown");
  });
});
