"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MONICE_OFFERS,
  randPerGb,
  type MoniceOffer,
} from "@/components/sites/qr-telkom-co-za-50a80143/shared/catalog";
import {
  QrFooterNav,
  QrHeader,
  QrSiteFooter,
  QrStepBar,
} from "@/components/sites/qr-telkom-co-za-50a80143/shared/QrChrome";
import { useDemo } from "@/hooks/useDemo";
import "@/components/sites/qr-telkom-co-za-50a80143/shared/qr-telkom.css";

const CATEGORIES = ["Voice Offers", "Data Offers", "Combo Offers"] as const;

export function MoniceBundleSelectPage() {
  const router = useRouter();
  const { track, notifyPortalEvent, moniceOfferHint, clearMoniceOfferHint } =
    useDemo();
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>("Data Offers");
  const [selected, setSelected] = useState<MoniceOffer | null>(null);
  const [viewed, setViewed] = useState<string[]>([]);
  const [guidedFlash, setGuidedFlash] = useState<string | null>(null);

  useEffect(() => {
    void track("page_view", "/monice/bundle-select");
  }, [track]);

  useEffect(() => {
    if (!moniceOfferHint) return;
    const match = MONICE_OFFERS.find((x) => x.id === moniceOfferHint.offerId);
    if (!match) {
      clearMoniceOfferHint();
      return;
    }
    setCategory(match.category as (typeof CATEGORIES)[number]);
    setSelected(match);
    setViewed((prev) =>
      prev.includes(match.id) ? prev : [...prev, match.id],
    );
    setGuidedFlash("Assistant selected this offer — continue when ready.");
    clearMoniceOfferHint();
    const t = window.setTimeout(() => setGuidedFlash(null), 4000);
    return () => window.clearTimeout(t);
  }, [moniceOfferHint, clearMoniceOfferHint]);

  const offers = useMemo(
    () => MONICE_OFFERS.filter((o) => o.category === category),
    [category],
  );

  const pick = (o: MoniceOffer) => {
    setSelected(o);
    const next = viewed.includes(o.id) ? viewed : [...viewed, o.id];
    setViewed(next);
    void track("product_view", "/monice/bundle-select", o.id);
    if (next.length >= 2) {
      void track("product_compare", "/monice/bundle-select", o.id);
      notifyPortalEvent({
        kind: "monice_compare",
        category,
        selectedId: o.id,
        viewedOfferIds: next,
        candidates: offers,
      });
    } else {
      notifyPortalEvent({
        kind: "monice_browse",
        category,
        selectedId: o.id,
        viewedOfferIds: next,
        candidates: offers,
      });
    }
  };

  return (
    <div className="qr-telkom flex min-h-full flex-col">
      <QrHeader />
      <QrStepBar title="Mo'nice" step={2} />

      <div className="container mx-auto my-10 flex-1 px-6 lg:px-52">
        <div className="rounded-[10px] bg-white p-5 md:p-[30px]">
          <section>
            <h2 className="text-[20px] font-light leading-8 text-[var(--qr-blue-text)]">
              <span className="font-bold">01</span> Select product
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="qr-select-tile min-w-[140px] rounded-full px-5 py-3 text-[15px] font-semibold"
                  data-selected={category === c}
                  onClick={() => {
                    setCategory(c);
                    setSelected(null);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-[20px] font-light leading-8 text-[var(--qr-blue-text)]">
              <span className="font-bold">02</span> Select bundle size
            </h2>
            <div className="mt-4 grid gap-3">
              {offers.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="qr-select-tile px-4 py-4 text-left text-[15px] font-semibold text-[var(--qr-blue-text)]"
                  data-selected={selected?.id === o.id}
                  onClick={() => pick(o)}
                >
                  <div>{o.title}</div>
                  {o.volumeMb > 0 && (
                    <div className="mt-1 text-xs font-normal text-[var(--qr-muted)]">
                      ≈ R{randPerGb(o.price, o.volumeMb).toFixed(2)} / GB ·{" "}
                      {o.validityDays} days
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--qr-muted)]">
              Compare two or more — the assistant may suggest a better value;
              selection stays on this page.
            </p>
            {guidedFlash && (
              <p className="mt-2 rounded-lg bg-[#e8f5ff] px-3 py-2 text-sm font-semibold text-[var(--qr-blue-deep)]">
                {guidedFlash}
              </p>
            )}
          </section>
        </div>
      </div>

      <QrFooterNav
        onBack={() => router.push("/")}
        nextDisabled={!selected}
        nextLabel="Ask assistant"
        onNext={() => {
          if (!selected) return;
          notifyPortalEvent({
            kind: "monice_checkout_intent",
            category,
            selectedId: selected.id,
            viewedOfferIds: viewed,
            candidates: offers,
          });
        }}
      />
      <QrSiteFooter />
    </div>
  );
}
