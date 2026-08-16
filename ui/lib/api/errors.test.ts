import { describe, it, expect, vi, afterEach } from "vitest";
import { BadRequestError, toErrorResponse } from "./errors";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toErrorResponse", () => {
  it("maps BadRequestError to an opaque 400", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const response = toErrorResponse(new BadRequestError());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Bad request" });
  });

  it("maps anything else to a 500 without leaking the message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = toErrorResponse(new Error("db connection string leaked"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });

  it("handles a non-Error throw", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = toErrorResponse("something odd");

    expect(response.status).toBe(500);
  });

  it("logs unexpected errors at error level, bad requests at log level", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    toErrorResponse(new BadRequestError());
    expect(log).toHaveBeenCalledWith("[api] bad request: Bad request");
    expect(err).not.toHaveBeenCalled();

    toErrorResponse(new Error("boom"));
    expect(err).toHaveBeenCalled();
  });
});
