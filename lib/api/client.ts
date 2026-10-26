"use client";

let volatileSessionId: string | undefined;

function createSessionId() {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function getClientSessionId(): string {
  if (typeof window === "undefined") return "sess_ssr";
  const key = "vodacom_demo_sid";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = createSessionId();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    // Some privacy modes block localStorage; requests should still work.
    return (volatileSessionId ??= createSessionId());
  }
}

export async function apiFetch(path: string, init?: RequestInit) {
  const sid = getClientSessionId();
  const headers = new Headers(init?.headers);
  headers.set("x-session-id", sid);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers });
}
