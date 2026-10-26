"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUNDLE_TYPE_ORDER,
  TOPUP_BUNDLES,
  TOPUP_PRODUCTS,
  type BundleType,
  type TopUpBundle,
  type TopUpProduct,
} from "@/components/sites/qr-telkom-co-za-50a80143/shared/catalog";
import {
  QrFooterNav,
  QrHeader,
  QrSiteFooter,
  QrStepBar,
} from "@/components/sites/qr-telkom-co-za-50a80143/shared/QrChrome";
import { useDemo } from "@/hooks/useDemo";
import { PaymentVerifyModals } from "@/components/payment/PaymentVerifyModals";
import "@/components/sites/qr-telkom-co-za-50a80143/shared/qr-telkom.css";

type Phase = "msisdn" | "catalog" | "summary";
type PayMethod = "airtime" | "card";

function optionLabel(bundle: TopUpBundle) {
  return `${bundle.type} ${bundle.volume} ${bundle.product}`;
}

export function TopUpDataPage() {
  const router = useRouter();
  const {
    customer,
    track,
    notifyPortalEvent,
    portalShelfHint,
    clearPortalShelfHint,
    setPortalSelection,
    startDeviceUpgrade,
  } = useDemo();
  const [phase, setPhase] = useState<Phase>("msisdn");
  const [msisdn, setMsisdn] = useState("");
  const [product, setProduct] = useState<TopUpProduct | null>(null);
  const [bundleType, setBundleType] = useState<BundleType | null>(null);
  const [bundle, setBundle] = useState<TopUpBundle | null>(null);
  const [viewed, setViewed] = useState<string[]>([]);
  const [guidedFlash, setGuidedFlash] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>("airtime");
  const [otpOpen, setOtpOpen] = useState(false);
  const mountedAt = useRef(
    typeof performance !== "undefined" ? performance.now() : Date.now(),
  );

  useEffect(() => {
    if (customer?.sim.msisdn) setMsisdn(customer.sim.msisdn);
  }, [customer?.sim.msisdn]);

  // Mirror the live selection into demo state so the workflow panel on the
  // right always matches what is highlighted on this page.
  useEffect(() => {
    setPortalSelection(bundle);
  }, [bundle, setPortalSelection]);
  useEffect(() => () => setPortalSelection(null), [setPortalSelection]);

  useEffect(() => {
    void track("page_view", "/qr_portal/top-up/data");
    mountedAt.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
  }, [track]);

  useEffect(() => {
    if (!portalShelfHint) return;
    const match = TOPUP_BUNDLES.find((x) => x.id === portalShelfHint.bundleId);
    if (!match) {
      clearPortalShelfHint();
      return;
    }
    setPhase("catalog");
    setProduct(match.product);
    setBundleType(match.type);
    setBundle(match);
    setViewed((prev) =>
      prev.includes(match.id) ? prev : [...prev, match.id],
    );
    setGuidedFlash(`Selected ${match.volume} — tap Next to continue.`);
    clearPortalShelfHint();
    const t = window.setTimeout(() => setGuidedFlash(null), 4000);
    return () => window.clearTimeout(t);
  }, [portalShelfHint, clearPortalShelfHint]);

  const types = useMemo(() => {
    if (!product) return [] as BundleType[];
    const found = new Set(
      TOPUP_BUNDLES.filter((x) => x.product === product).map((x) => x.type),
    );
    return BUNDLE_TYPE_ORDER.filter((t) => found.has(t));
  }, [product]);

  const bundles = useMemo(() => {
    if (!product || !bundleType) return [] as TopUpBundle[];
    return TOPUP_BUNDLES.filter(
      (x) => x.product === product && x.type === bundleType,
    );
  }, [product, bundleType]);

  const dwellSec = () => {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    return Math.floor((now - mountedAt.current) / 1000);
  };

  const selectProduct = (p: TopUpProduct) => {
    setProduct(p);
    setBundleType(null);
    setBundle(null);
    if (
      p === "Data" &&
      startDeviceUpgrade({ injectUser: true, replace: true, toast: true })
    ) {
      void track("product_view", "/qr_portal/top-up/data", p);
      return;
    }
    void track(p === "Data" ? "fast_forward" : "product_view", "/qr_portal/top-up/data", p, {
      allowProactive: p === "Data",
    });
  };

  const selectType = (t: BundleType) => {
    setBundleType(t);
    setBundle(null);
    void track("product_compare", "/qr_portal/top-up/data", product ?? undefined, {
      bundleType: t,
    });
  };

  const selectBundle = (x: TopUpBundle) => {
    setBundle(x);
    const next = viewed.includes(x.id) ? viewed : [...viewed, x.id];
    setViewed(next);
    void track("product_detail", "/qr_portal/top-up/data", x.id, {
      volume: x.volume,
      price: x.price,
    });
  };

  const fireCheckoutGate = (selected: TopUpBundle, force = false) => {
    const shelf = TOPUP_BUNDLES.filter(
      (x) => x.product === selected.product && x.type === selected.type,
    );
    return notifyPortalEvent({
      kind: "bundle_selected",
      product: selected.product,
      bundleType: selected.type,
      selectedId: selected.id,
      viewedBundleIds: viewed.includes(selected.id)
        ? viewed
        : [...viewed, selected.id],
      candidates: shelf.map((c) => ({
        id: c.id,
        volume: c.volume,
        volumeMb: c.volumeMb,
        price: c.price,
        label: c.label,
        unlimited: c.unlimited,
      })),
      dwellTimeSec: force ? 20 : dwellSec(),
      comparisonCount: Math.max(viewed.length, force ? 3 : viewed.length),
      purchaseIntent: "HIGH",
      force,
    });
  };

  const goSummary = () => {
    setOtpOpen(false);
    setPhase("summary");
    void track("checkout_start", "/qr_portal/top-up/data/payment-summary", bundle?.id);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        "/qr_portal/top-up/data/payment-summary",
      );
    }
  };

  const stepMeta =
    phase === "msisdn"
      ? { step: 1, label: "Specify amount" as const }
      : phase === "catalog"
        ? { step: 2, label: "Specify amount" as const }
        : { step: 2, label: "Payment Details" as const };

  return (
    <div className="qr-telkom flex min-h-full flex-col">
      <QrHeader />
      <QrStepBar
        title="Top up data"
        step={stepMeta.step}
        label={stepMeta.label}
      />

      <div className="container mx-auto my-10 flex-1 px-6 lg:px-52">
        {phase !== "summary" ? (
          <div className="rounded-[10px] bg-white p-5 md:p-[30px]">
            {phase === "msisdn" ? (
              <>
                <h2 className="border-b-2 border-[var(--qr-line)] pb-[30px] text-[20px] font-light leading-8 text-[var(--qr-blue-text)]">
                  <span className="font-bold">01</span> Mobile number
                </h2>
                <div className="mt-[30px] rounded-[10px] bg-[var(--qr-bg)] p-5 md:p-[30px]">
                  <p className="text-[14px] font-light leading-[22px] lg:text-[16px]">
                    Enter mobile number below.
                  </p>
                  <p className="mt-6 text-left text-[14px] font-light">
                    Mobile number
                  </p>
                  <div className="mt-2 flex max-w-[340px] items-center overflow-hidden rounded-[5px] border border-[#DADEE0] bg-white">
                    <input
                      value={msisdn}
                      maxLength={10}
                      onChange={(e) =>
                        setMsisdn(e.target.value.replace(/\D/g, ""))
                      }
                      className="flex-1 bg-white p-[10px] text-[14px] text-[var(--qr-blue-text)] outline-none"
                      placeholder="Enter mobile number"
                      aria-label="Mobile number"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <section>
                  <h2 className="text-[20px] font-light leading-8 text-[var(--qr-blue-text)]">
                    <span className="font-bold">02</span> Select your product
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {TOPUP_PRODUCTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="qr-select-tile px-4 py-4 text-left text-[15px] font-semibold text-[var(--qr-blue-text)]"
                        data-selected={product === p}
                        onClick={() => selectProduct(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </section>

                {product && types.length > 0 && (
                  <section className="mt-8">
                    <h2 className="text-[20px] font-light leading-8 text-[var(--qr-blue-text)]">
                      <span className="font-bold">03</span> Select bundle type
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {types.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="qr-select-tile min-w-[140px] px-5 py-3 text-[15px] font-semibold"
                          data-selected={bundleType === t}
                          onClick={() => selectType(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {bundleType && (
                  <section className="mt-8">
                    <h2 className="text-[20px] font-light leading-8 text-[var(--qr-blue-text)]">
                      <span className="font-bold">04</span> Select your bundle
                    </h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {bundles.map((x) => (
                        <button
                          key={x.id}
                          type="button"
                          className="qr-select-tile flex items-end justify-between px-4 py-5 text-left"
                          data-selected={bundle?.id === x.id}
                          onClick={() => selectBundle(x)}
                        >
                          <div>
                            <div className="text-sm text-[var(--qr-muted)]">
                              {x.label}
                            </div>
                            <div className="mt-2 text-[20px] font-bold leading-tight text-[var(--qr-blue)]">
                              {x.volume}
                            </div>
                          </div>
                          <div className="text-[18px] font-bold text-[var(--qr-ink)]">
                            R {x.price.toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-[var(--qr-muted)]">
                      Select a bundle, then Next. Sipho: higher data SKU.
                      Thabo: Huawei contract deal.
                    </p>
                    {guidedFlash && (
                      <p className="mt-2 rounded-lg bg-[#e8f5ff] px-3 py-2 text-sm font-semibold text-[var(--qr-blue-deep)]">
                        {guidedFlash}
                      </p>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        ) : (
          bundle && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
              <div className="space-y-5">
                <section className="rounded-[10px] bg-white p-5 shadow-[0_2px_12px_rgba(136,138,155,0.1)] md:p-7">
                  <h2 className="text-[22px] font-bold text-[var(--qr-blue-text)]">
                    Your Summary
                  </h2>
                  <div className="mt-5 overflow-hidden rounded-[8px] border border-[var(--qr-line)] bg-[var(--qr-bg)]">
                    <dl className="divide-y divide-[var(--qr-line)] text-[14px]">
                      <div className="flex justify-between gap-4 px-4 py-3">
                        <dt className="text-[var(--qr-muted)]">Mobile number</dt>
                        <dd className="font-semibold text-[var(--qr-blue-text)]">
                          {msisdn}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 px-4 py-3">
                        <dt className="text-[var(--qr-muted)]">Option</dt>
                        <dd className="max-w-[65%] text-right font-semibold text-[var(--qr-blue-text)]">
                          {optionLabel(bundle)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 px-4 py-3">
                        <dt className="font-semibold text-[var(--qr-blue-text)]">
                          Total
                        </dt>
                        <dd className="text-[18px] font-bold text-[var(--qr-blue-text)]">
                          R {bundle.price.toFixed(2)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </section>

                <section className="rounded-[10px] bg-white p-5 shadow-[0_2px_12px_rgba(136,138,155,0.1)] md:p-7">
                  <h2 className="text-[22px] font-bold text-[var(--qr-blue-text)]">
                    Payment Option
                  </h2>
                  <div className="mt-4 space-y-3">
                    {(
                      [
                        ["airtime", "Airtime"],
                        ["card", "Card"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPayMethod(id)}
                        className={`flex w-full items-center gap-3 rounded-[8px] border px-4 py-3 text-left text-[15px] font-semibold ${
                          payMethod === id
                            ? "border-[var(--qr-blue)] bg-[#e8f5ff] text-[var(--qr-blue-text)]"
                            : "border-[var(--qr-line)] bg-white text-[var(--qr-blue-text)]"
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                            payMethod === id
                              ? "border-[var(--qr-blue)]"
                              : "border-[#c5ccd4]"
                          }`}
                          aria-hidden
                        >
                          {payMethod === id && (
                            <span className="h-2.5 w-2.5 rounded-full bg-[var(--qr-blue)]" />
                          )}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="h-fit rounded-[10px] bg-white p-5 shadow-[0_2px_12px_rgba(136,138,155,0.1)] md:p-7">
                <h2 className="text-[22px] font-bold text-[var(--qr-blue-text)]">
                  Your Items
                </h2>
                <dl className="mt-5 space-y-3 text-[14px]">
                  <div className="flex justify-between rounded-[6px] bg-[#e8f5ff] px-3 py-2 font-bold text-[var(--qr-blue-text)]">
                    <dt>Total</dt>
                    <dd>R {bundle.price.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between px-1 text-[var(--qr-blue-text)]">
                    <dt>Once-off</dt>
                    <dd className="font-semibold">
                      R {bundle.price.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-[var(--qr-line)] px-1 pt-3 font-bold text-[var(--qr-blue-text)]">
                    <dt>Total outstanding</dt>
                    <dd>R {bundle.price.toFixed(2)}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          )
        )}
      </div>

      <QrFooterNav
        onBack={() => {
          if (otpOpen) {
            setOtpOpen(false);
            return;
          }
          if (phase === "summary") {
            setPhase("catalog");
            if (typeof window !== "undefined") {
              window.history.replaceState(null, "", "/qr_portal/top-up/data");
            }
            return;
          }
          if (phase === "catalog") setPhase("msisdn");
          else router.push("/");
        }}
        nextDisabled={
          otpOpen ||
          (phase === "msisdn"
            ? msisdn.length < 10
            : phase === "catalog"
              ? !bundle
              : !bundle)
        }
        onNext={() => {
          if (phase === "msisdn") {
            void track("portal_login", "/qr_portal/top-up/data", undefined, {
              msisdnLast4: msisdn.slice(-4),
            });
            setPhase("catalog");
            return;
          }
          if (phase === "catalog" && bundle) {
            const interrupted = fireCheckoutGate(bundle);
            if (!interrupted) goSummary();
            return;
          }
          if (phase === "summary" && bundle) {
            setOtpOpen(true);
          }
        }}
        nextLabel="Next"
      />
      <QrSiteFooter />

      {otpOpen && bundle && (
        <PaymentVerifyModals
          key={`topup-${bundle.id}`}
          open
          msisdn={msisdn}
          productLabel={optionLabel(bundle)}
          amountLabel={`R ${bundle.price.toFixed(2)}`}
          successVerb="successfully loaded to"
          onClose={() => setOtpOpen(false)}
          onSuccess={() => {
            setOtpOpen(false);
            void track(
              "purchase_complete",
              "/qr_portal/top-up/data/payment-summary",
              bundle.id,
            );
            router.push("/");
          }}
        />
      )}
    </div>
  );
}
