# TopUpDataPage Specification

## Overview
- **Target file:** `components/sites/qr-vodacom-co-za-50a80143/qr_portal-top-up-data-9cab9496/TopUpDataPage.tsx`
- **Screenshot:** `docs/design-references/qr-vodacom-co-za-50a80143/qr_portal-top-up-data-9cab9496/step02-product.png`, `step04-bundles.png`
- **Interaction model:** click-driven multi-step (msisdn → product → type → bundle)

## DOM Structure
QrHeader → QrStepBar → white card (01/02/03/04) → QrFooterNav → QrSiteFooter

## Computed Styles (from live HTML class tokens + screenshots)
- Page bg: `#f3f5f8`
- Blue text: `#005288`
- Primary blue: `#0099ff`
- Progress green: `#91e200`
- Selected tile: light blue fill `#e8f5ff` + blue border
- Card radius: `10px`; tile radius: `8px`
- Sticky footer shadow: `0 -8px 50px rgba(8,45,108,0.15)`

## States & Behaviors
- Next disabled until MSISDN length 10 / bundle selected
- Selecting ≥2 bundles fires `topup_hesitation` → chatbot compare + buy-in-chat
- Next on catalog with selection → `topup_checkout_intent` (chat only)

## Text Content
Products: Social Bundles, Data Bundles, TikTok Bundles - Once Off, WhatsApp Bundles Once-off, Streaming Bundles, Daily Dose Gigs, Vodacom Mobile Data Bundles. Hourly 150MB R5.50 / 300MB R9.00.

## Responsive
Desktop centered column `lg:px-52`; mobile full-width padding.
