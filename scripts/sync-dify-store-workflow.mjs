#!/usr/bin/env node
/**
 * Sync a real ranking workflow into Vodacom-Store-Locator (Code node).
 * Pattern inspired by Transnet-dify: pure workflow + code tools, no Agent.
 *
 * Usage (from vodacom-demo/):
 *   DIFY_CONSOLE_EMAIL=... DIFY_CONSOLE_PASSWORD=... node scripts/sync-dify-store-workflow.mjs
 */
const BASE = (process.env.DIFY_CONSOLE_URL || "http://182.160.17.112").replace(
  /\/$/,
  "",
);
const APP_NAME = "Vodacom-Store-Locator";

function encryptPassword(plain) {
  return Buffer.from(String(plain), "utf8").toString("base64");
}

function parseCookies(list) {
  const out = {};
  for (const c of list || []) {
    if (!c) continue;
    const first = String(c).split(";")[0];
    const eq = first.indexOf("=");
    if (eq > 0) out[first.slice(0, eq).trim()] = first.slice(eq + 1).trim();
  }
  return out;
}

async function login() {
  const email = process.env.DIFY_CONSOLE_EMAIL;
  const password = process.env.DIFY_CONSOLE_PASSWORD;
  if (!email || !password) throw new Error("Need DIFY_CONSOLE_EMAIL + PASSWORD");
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
  if (!res.ok) throw new Error(await res.text());
  const jar = parseCookies(res.headers.getSetCookie?.() || []);
  if (!jar.access_token) throw new Error("No access_token");
  return jar;
}

function headers(jar) {
  return {
    Authorization: `Bearer ${jar.access_token}`,
    Cookie: Object.entries(jar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
    "X-CSRF-Token": jar.csrf_token || "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

const CODE = `
function toRad(d){ return d*Math.PI/180; }
function haversineKm(a,b){
  const R=6371;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const lat1=toRad(a.lat), lat2=toRad(b.lat);
  const h=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

function parseCatalog(raw){
  try {
    const j = typeof raw === 'string' ? JSON.parse(raw||'[]') : (raw||[]);
    return Array.isArray(j) ? j : [];
  } catch { return []; }
}

function cityDefaults(){
  return {
    johannesburg:{lat:-26.2041,lng:28.0473},
    sandton:{lat:-26.1086,lng:28.0517},
    rosebank:{lat:-26.1456,lng:28.0416},
    'cape town':{lat:-33.9249,lng:18.4241},
    durban:{lat:-29.8587,lng:31.0218},
    pretoria:{lat:-25.7479,lng:28.2293},
  };
}

function main({ query, lat, lng, catalog }) {
  let stores = parseCatalog(catalog);
  if (!stores.length) {
    stores = [
      {id:'store-sandton',name:'Vodacom Sandton City',address:'Sandton City Mall, Johannesburg',city:'Johannesburg',lat:-26.1086,lng:28.0517},
      {id:'store-rosebank',name:'Vodacom The Zone @ Rosebank',address:'The Zone, Oxford Rd, Rosebank',city:'Johannesburg',lat:-26.1456,lng:28.0416},
      {id:'store-canal',name:'Vodacom Canal Walk',address:'Canal Walk Shopping Centre, Cape Town',city:'Cape Town',lat:-33.8925,lng:18.5112},
      {id:'store-vna',name:'Vodacom V&A Waterfront',address:'V&A Waterfront, Cape Town',city:'Cape Town',lat:-33.9036,lng:18.4204},
      {id:'store-gateway',name:'Vodacom Gateway',address:'Gateway Theatre of Shopping, Durban',city:'Durban',lat:-29.7265,lng:31.0654},
      {id:'store-menlyn',name:'Vodacom Menlyn Maine',address:'Menlyn Maine Central Square, Pretoria',city:'Pretoria',lat:-25.7865,lng:28.2773}
    ];
  }

  let origin = null;
  const latN = Number(lat), lngN = Number(lng);
  if (Number.isFinite(latN) && Number.isFinite(lngN) && !(latN===0 && lngN===0)) {
    origin = { lat: latN, lng: lngN };
  } else if (query && String(query).trim()) {
    const q = String(query).trim().toLowerCase();
    const defaults = cityDefaults();
    for (const [k,v] of Object.entries(defaults)) {
      if (q.includes(k)) { origin = v; break; }
    }
    if (!origin) {
      // text score fallback
      const scored = stores.map(s => {
        const hay = \`\${s.name} \${s.address} \${s.city}\`.toLowerCase();
        let score = 0;
        for (const t of q.split(/\\s+/)) if (t.length>2 && hay.includes(t)) score += 3;
        if (hay.includes(q)) score += 10;
        return { ...s, score };
      }).filter(s=>s.score>0).sort((a,b)=>b.score-a.score);
      return { stores: JSON.stringify((scored.length?scored:stores).slice(0,4).map(({score,...s})=>({...s}))) };
    }
  }

  if (origin) {
    const ranked = stores.map(s => ({
      ...s,
      distanceKm: Math.round(haversineKm(origin, {lat:Number(s.lat), lng:Number(s.lng)}) * 10) / 10,
    })).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,4);
    return { stores: JSON.stringify(ranked) };
  }

  return { stores: JSON.stringify(stores.slice(0,4)) };
}
`;

function graph() {
  return {
    nodes: [
      {
        id: "start",
        type: "custom",
        data: {
          type: "start",
          title: "Start",
          variables: [
            { variable: "query", label: "query", type: "text-input", required: false, max_length: 200 },
            { variable: "lat", label: "lat", type: "text-input", required: false, max_length: 40 },
            { variable: "lng", label: "lng", type: "text-input", required: false, max_length: 40 },
            { variable: "catalog", label: "catalog", type: "paragraph", required: false },
          ],
        },
        position: { x: 80, y: 280 },
      },
      {
        id: "rank",
        type: "custom",
        data: {
          type: "code",
          title: "Rank stores",
          code_language: "javascript",
          code: CODE.trim(),
          variables: [
            { variable: "query", value_selector: ["start", "query"] },
            { variable: "lat", value_selector: ["start", "lat"] },
            { variable: "lng", value_selector: ["start", "lng"] },
            { variable: "catalog", value_selector: ["start", "catalog"] },
          ],
          outputs: {
            stores: { type: "string", children: null },
          },
        },
        position: { x: 380, y: 280 },
      },
      {
        id: "end",
        type: "custom",
        data: {
          type: "end",
          title: "End",
          outputs: [
            { variable: "stores", value_selector: ["rank", "stores"] },
          ],
        },
        position: { x: 700, y: 280 },
      },
    ],
    edges: [
      {
        id: "e-start-rank",
        source: "start",
        target: "rank",
        sourceHandle: "source",
        targetHandle: "target",
      },
      {
        id: "e-rank-end",
        source: "rank",
        target: "end",
        sourceHandle: "source",
        targetHandle: "target",
      },
    ],
  };
}

async function main() {
  const jar = await login();
  const h = headers(jar);
  const list = await fetch(`${BASE}/console/api/apps?page=1&limit=100`, {
    headers: h,
  }).then((r) => r.json());
  const app = (list.data || []).find((a) => a.name === APP_NAME);
  if (!app) throw new Error(`${APP_NAME} not found — run create-dify-store-locator.mjs first`);

  // Dify requires current draft hash or returns 409 draft_workflow_not_sync
  const draft = await fetch(
    `${BASE}/console/api/apps/${app.id}/workflows/draft`,
    { headers: h },
  ).then((r) => r.json());
  if (!draft.hash) throw new Error("No draft hash — open the app once in console");

  const payload = {
    graph: graph(),
    features: draft.features || {},
    environment_variables: draft.environment_variables || [],
    conversation_variables: draft.conversation_variables || [],
    hash: draft.hash,
  };
  const sync = await fetch(`${BASE}/console/api/apps/${app.id}/workflows/draft`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(payload),
  });
  const syncBody = await sync.json();
  if (!sync.ok) {
    console.error("Sync failed", sync.status, syncBody);
    process.exit(1);
  }
  console.log("Draft synced", syncBody.hash || syncBody);

  const pub = await fetch(`${BASE}/console/api/apps/${app.id}/workflows/publish`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      marked_name: "store-rank-v3",
      marked_comment: "Sync function main + Haversine/city rank (not async)",
    }),
  });
  const pubBody = await pub.json();
  console.log("Publish", pub.status, pubBody);
  console.log(`Open: ${BASE}/app/${app.id}/workflow`);
  console.log("Smoke: POST /v1/workflows/run with DIFY_STORE_API_KEY → outputs.stores JSON");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
