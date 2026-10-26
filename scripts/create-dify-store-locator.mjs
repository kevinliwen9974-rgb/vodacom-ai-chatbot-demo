#!/usr/bin/env node
/**
 * Create a NEW Dify workflow app "Vodacom-Store-Locator" via Console API.
 * Does not modify existing apps.
 *
 * Usage (from vodacom-demo/):
 *   DIFY_CONSOLE_EMAIL=... DIFY_CONSOLE_PASSWORD=... node scripts/create-dify-store-locator.mjs
 */
const BASE = (process.env.DIFY_CONSOLE_URL || "http://182.160.17.112").replace(
  /\/$/,
  "",
);

/** Dify web UI encryptPassword = base64(utf8). */
function encryptPassword(plain) {
  return Buffer.from(String(plain), "utf8").toString("base64");
}

function cookieToken(setCookie) {
  if (!setCookie) return null;
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of parts) {
    const m = /(?:^|,\s*)access_token=([^;]+)/.exec(c);
    if (m) return m[1];
  }
  // Node fetch may join cookies; try simple split
  const m2 = /access_token=([^;]+)/.exec(String(setCookie));
  return m2?.[1] ?? null;
}

function parseCookies(setCookieList) {
  const out = {};
  for (const c of setCookieList || []) {
    if (!c) continue;
    const first = String(c).split(";")[0];
    const eq = first.indexOf("=");
    if (eq < 0) continue;
    out[first.slice(0, eq).trim()] = first.slice(eq + 1).trim();
  }
  return out;
}

async function login() {
  if (process.env.DIFY_CONSOLE_TOKEN) {
    return {
      access_token: process.env.DIFY_CONSOLE_TOKEN,
      csrf_token: process.env.DIFY_CSRF_TOKEN || "",
      refresh_token: "",
    };
  }
  const email = process.env.DIFY_CONSOLE_EMAIL;
  const password = process.env.DIFY_CONSOLE_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set DIFY_CONSOLE_TOKEN or DIFY_CONSOLE_EMAIL + DIFY_CONSOLE_PASSWORD",
    );
  }
  const res = await fetch(`${BASE}/console/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      email,
      password: encryptPassword(password),
      language: "en-US",
      remember_me: true,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(JSON.stringify(data));

  const cookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  const jar = parseCookies(cookies);
  if (!jar.access_token) {
    res.headers.forEach((v, k) => {
      if (k.toLowerCase() === "set-cookie") Object.assign(jar, parseCookies([v]));
    });
  }
  if (!jar.access_token) {
    throw new Error(
      `Login succeeded but no access_token cookie: ${JSON.stringify(data)}`,
    );
  }
  return jar;
}

function authHeaders(jar) {
  const cookie = Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  const headers = {
    Authorization: `Bearer ${jar.access_token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    Cookie: cookie,
  };
  if (jar.csrf_token) {
    headers["X-CSRF-Token"] = jar.csrf_token;
  }
  return headers;
}

async function main() {
  const jar = await login();
  console.log("Logged in.");
  const headers = authHeaders(jar);

  const listRes = await fetch(`${BASE}/console/api/apps?page=1&limit=100`, {
    headers,
  });
  const list = await listRes.json();
  if (!listRes.ok) {
    console.error("List apps failed", listRes.status, list);
    process.exit(1);
  }
  const apps = list.data || [];
  const existing = (Array.isArray(apps) ? apps : []).find(
    (a) => a.name === "Vodacom-Store-Locator",
  );
  let appId = existing?.id;
  if (existing) {
    console.log("App already exists:", appId);
  } else {
    const create = await fetch(`${BASE}/console/api/apps`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Vodacom-Store-Locator",
        mode: "workflow",
        description:
          "Vodacom demo store locator — ranks catalogue by lat/lng or suburb query. Do not delete.",
        icon_type: "emoji",
        icon: "📍",
        icon_background: "#FFEAD5",
      }),
    });
    const body = await create.json();
    if (!create.ok) {
      console.error("Create failed", create.status, body);
      process.exit(1);
    }
    appId = body.id || body.data?.id;
    console.log("Created app", appId);
  }

  const keysRes = await fetch(`${BASE}/console/api/apps/${appId}/api-keys`, {
    headers,
  });
  const keysBody = await keysRes.json();
  let tokenOut =
    keysBody.data?.[0]?.token || keysBody[0]?.token || keysBody.token || "";

  if (!tokenOut || String(tokenOut).includes("*")) {
    const keyRes = await fetch(`${BASE}/console/api/apps/${appId}/api-keys`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    const keyBody = await keyRes.json();
    console.log("API key create:", JSON.stringify(keyBody, null, 2));
    tokenOut = keyBody.token || keyBody.data?.token || keyBody.api_key || "";
  } else {
    console.log("Existing keys:", JSON.stringify(keysBody, null, 2));
  }

  if (tokenOut && !String(tokenOut).includes("*")) {
    console.log("\nAdd to vodacom-demo/.env.local:\n");
    console.log(`DIFY_STORE_API_KEY=${tokenOut}`);
    // Write into .env.local if present
    const fs = await import("fs");
    const path = ".env.local";
    if (fs.existsSync(path)) {
      let env = fs.readFileSync(path, "utf8");
      if (/^DIFY_STORE_API_KEY=/m.test(env)) {
        env = env.replace(/^DIFY_STORE_API_KEY=.*$/m, `DIFY_STORE_API_KEY=${tokenOut}`);
      } else {
        env += `\nDIFY_STORE_API_KEY=${tokenOut}\n`;
      }
      fs.writeFileSync(path, env);
      console.log("\nUpdated .env.local");
    }
  } else {
    console.log(
      "\nOpen the app in Dify → API Access → copy the API key into DIFY_STORE_API_KEY.",
    );
    console.log(`App URL: ${BASE}/app/${appId}/workflow`);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
