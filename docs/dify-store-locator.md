# Vodacom-Store-Locator — paused

**Demo currently does NOT call Dify for stores.**  
SIM flow opens the official [Vodacom Store Locator](https://www.vodacom.co.za/storelocator) in a new tab (`open_store_locator`), then continues booking/payment in chat.

Local Haversine helpers in `lib/ai/stores-locate.ts` remain unused by the primary UX.

Scripts below remain for a later re-enable; do **not** edit other apps on http://182.160.17.112/apps.

## Runtime (active)

`POST /api/ai/stores` → [`lib/ai/stores-locate.ts`](../lib/ai/stores-locate.ts):

1. lat/lng → local Haversine on catalogue
2. suburb text → Nominatim geocode + Haversine
3. else → local text match

## Re-enable Dify later (optional)

```bash
cd /Users/shenbinchang/Documents/VDC/vodacom-demo
DIFY_CONSOLE_EMAIL='…' DIFY_CONSOLE_PASSWORD='…' \
  node scripts/create-dify-store-locator.mjs
DIFY_CONSOLE_EMAIL='…' DIFY_CONSOLE_PASSWORD='…' \
  node scripts/sync-dify-store-workflow.mjs
```

Then wire `DIFY_STORE_API_KEY` back into a locate layer (previous pattern lived in `dify-maps.ts`).

Notes if you revive sync:

- Draft sync needs current **`hash`** or `409 draft_workflow_not_sync`.
- Code node: use **`function main(...)`** (not `async`).
