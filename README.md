# Telkom AI Customer Experience Demo

High-fidelity **mock** Telkom In-Store / QR portal + chatbot mini-program.

Synthetic data only. Not connected to Telkom production systems.

## Quick start

```bash
cd telkom-demo
npm install
npm run dev
```

Open [http://localhost:3000/](http://localhost:3000/) — QR hub clone.

## Primary showcase (chatbot-first)

**Scene ① — WhatsApp checkout gate**
1. Top Up → WhatsApp Bundles → Daily → view 150/300/Unlimited → select **300MB R11** → **Next**
2. Toast: Before you go (+R4 → Daily unlimited)
3. **Get Daily unlimited** or **Keep 300MB** — pay in chat

**Scene ② — TikTok usage**
1. Top Up → **TikTok Bundles** (or Presenter **FF TikTok Usage**)
2. Pie chart (81% TikTok) → Show better plan → DATA-40GB in chat

Presenter: **FF WhatsApp Gate** | **FF TikTok Usage**

## Cloned routes

| Route | Source |
|-------|--------|
| `/` | https://qr.telkom.co.za/ |
| `/qr_portal/top-up/data` | https://qr.telkom.co.za/qr_portal/top-up/data? |
| `/monice/bundle-select` | https://qr.telkom.co.za/monice/bundle-select |

Assets under `public/sites/qr-telkom-co-za-50a80143/`. Research: `docs/research/qr-telkom-co-za-50a80143/`.

## What’s implemented vs stubbed

| Area | Status |
|------|--------|
| QR hub / Top Up / Mo’Nice UI clones | Done (screenshot + live HTML tokens) |
| Chatbot compare + buy-in-chat | Done |
| Behavior tracking + journey panel | Done |
| Billing Vision (`qwen3.6-27b`) | `/api/ai/analyze-bill` |
| ASR mic (`qwen3-asr-flash`) | Chat mic → `/api/ai/transcribe` |
| www.telkom.co.za/personal/deals | Deferred |
| Payfast / Ozow | Interface stubs |

## Env

```bash
DASHSCOPE_API_KEY=sk-...
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
DASHSCOPE_LLM_MODEL=qwen3.6-27b
DASHSCOPE_ASR_MODEL=qwen3-asr-flash
PAYMENT_PROVIDER=mock
```

Never put secrets in client components. Model names stay server-side only.
