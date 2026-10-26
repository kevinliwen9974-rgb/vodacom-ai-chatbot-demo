import { cookies } from "next/headers";

export const SESSION_COOKIE = "telkom_demo_sid";

export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;
  const id = `sess_${crypto.randomUUID()}`;
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return id;
}

export function ensureSessionIdFromHeader(headerValue: string | null): string {
  if (headerValue && headerValue.startsWith("sess_")) return headerValue;
  return `sess_${crypto.randomUUID()}`;
}
