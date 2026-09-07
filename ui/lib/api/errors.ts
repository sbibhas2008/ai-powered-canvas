import { NextResponse } from "next/server";

export class BadRequestError extends Error {
  constructor(message = "Bad request") {
    super(message);
    this.name = "BadRequestError";
  }
}

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof BadRequestError) {
    console.log(`[api] bad request: ${error.message}`);
    return badRequest(error.message);
  }

  console.error(`[api] unhandled error:`, error);
  return serverError();
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function rateLimited(
  message = "Rate limited. Please wait a few seconds.",
) {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}
