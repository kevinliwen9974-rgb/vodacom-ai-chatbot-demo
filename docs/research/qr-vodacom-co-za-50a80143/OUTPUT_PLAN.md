# Vodacom Clone + Chatbot-First Output Plan

Chrome MCP was intermittently unavailable; clones use live HTML class tokens + user screenshots as design truth.

## App root
`/Users/shenbinchang/Documents/VDC/vodacom-demo`

## Origins (combined app, route-scoped CSS under `.qr-vodacom`)
| Origin | site-key |
|--------|----------|
| https://qr.vodacom.co.za | `qr-vodacom-co-za-50a80143` |
| https://www.vodacom.co.za | deferred (phase-2) — QR portal covers demo scenarios |

## Pages
| Source URL | page-key | Destination route |
|------------|----------|-------------------|
| https://qr.vodacom.co.za/ | `root-8a5edab2` | `/` (QR hub) |
| https://qr.vodacom.co.za/qr_portal/top-up/data? | `qr_portal-top-up-data-9cab9496` | `/qr_portal/top-up/data` |
| https://qr.vodacom.co.za/summer-deals/bundle-select | `summer-deals-bundle-select-57cb6b32` | `/summer-deals/bundle-select` |

Existing `/customer/*` routes **preserved** (secondary). Primary demo entry becomes QR hub.

## Chatbot-first product rule
All recommend / compare / buy / receipt happens **inside ChatAssistant**. Portal pages only browse & select; they emit behavior events. No host-page checkout for the showcase path.

## Scenarios (low profile dependency)
1. **Top-up hesitation** — user opens Data Bundles, views 150MB vs 300MB → proactive cites last-month OOB → recommend larger once-off → Buy in chat
2. **Summer Deals compare** — user toggles Data Offers bundles → chat shows R/GB + validity comparison → upsell higher spend option → Buy in chat

Demo MSISDN seed: `0707690236`
