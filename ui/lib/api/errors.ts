import { NextResponse } from "next/server";

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function rateLimited(message = "Rate limited. Please wait a few seconds.") {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}
