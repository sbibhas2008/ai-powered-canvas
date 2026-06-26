export function parseJsonBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

export function getIp(request: Request): string {
  return request.headers.get("x-forwarded-for") ?? "unknown";
}
