import type { z } from "zod";
import { BadRequestError } from "./errors";

export function getIp(request: Request): string {
  return request.headers.get("x-forwarded-for") ?? "unknown";
}

export async function parseRequestBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    console.log(`[api] rejected body: malformed JSON`);
    throw new BadRequestError();
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    console.log(`[api] rejected body:`, result.error.issues);
    throw new BadRequestError();
  }

  return result.data;
}
