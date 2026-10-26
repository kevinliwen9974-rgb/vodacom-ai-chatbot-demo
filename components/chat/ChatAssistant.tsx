"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useDemo, type ChatChoice } from "@/hooks/useDemo";
import { AGENT_HOURS_LINES, AGENT_OFFLINE_HINT } from "@/lib/care/hours";
import { startMicRecording, type MicRecorderControls } from "@/lib/audio/mic";
import { apiFetch } from "@/lib/api/client";
import { extractCoveragePlace, isDeviceLocationRequest } from "@/lib/chat/intents";
import { matchKnownCoverageLocation } from "@/lib/coverage/resolve";
import {
  getTopUpBundle,
  TOPUP_BUNDLES,
} from "@/components/sites/qr-telkom-co-za-50a80143/shared/catalog";
import { AppUsagePie } from "@/components/chat/AppUsagePie";
import { UpgradeInsightCard } from "@/components/chat/UpgradeInsightCard";
import { DeviceDealCard } from "@/components/chat/DeviceDealCard";
import { SimInputWidget } from "@/components/chat/SimInputWidget";
import { CallbackRequestWidget } from "@/components/chat/CallbackRequestWidget";
import { LocationInput } from "@/components/chat/coverage/LocationInput";
import { LocationCard } from "@/components/chat/coverage/LocationCard";
import { CoverageChecking } from "@/components/chat/coverage/CoverageChecking";
import { CoverageResult } from "@/components/chat/coverage/CoverageResult";
import { CoverageFallback } from "@/components/chat/coverage/CoverageFallback";
import "@/components/chat/chat-assist.css";

const springSoft = { type: "spring" as const, stiffness: 420, damping: 32 };
const springPop = { type: "spring" as const, stiffness: 380, damping: 26 };

function TobiAvatar({ className = "", alt = "" }: { className?: string; alt?: string }) {
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden bg-[#e60000] ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/tobi-avatar.svg" alt="" className="h-full w-full object-cover" />
    </span>
  );
}

const BUNDLE_PICKS = TOPUP_BUNDLES.filter((b) =>
  [
    "TU-DATA-H-150",
    "TU-TT-D-300",
    "TU-WA-D-UNL",
    "TU-WA-D-150",
    "TU-DATA-H-300",
  ].includes(b.id),
).slice(0, 5);

export function ChatAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    chatOpen,
    proactiveOpen,
    proactiveMessage,
    messages,
    setMessages,
    recommendedProduct,
    acceptProactive,
    dismissProactive,
    openChat,
    closeChat,
    applyBundleGuide,
    checkoutBusy,
    customer,
    handleChatAction,
    advanceSimChat,
    completeSimDocs,
    startSimSelfCare,
    startBillingAssist,
    startDeviceUpgrade,
    startCoverageCheck,
    submitCoverageAddress,
    proposeCoverageLocation,
    proposeCoverageByCoords,
    coverageGeoFailed,
    adjustCoverageLocation,
    purchaseInChat,
    simActive,
    coverageActive,
    coverageState,
    agentDeskOpen,
  } = useDemo();

  const billingDeepLinkDone = useRef(false);
  useEffect(() => {
    if (billingDeepLinkDone.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("chat") !== "billing") return;
    billingDeepLinkDone.current = true;
    void startBillingAssist({ fromEmail: true, replace: true });
    router.replace(pathname || "/");
  }, [startBillingAssist, router, pathname]);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [asrBusy, setAsrBusy] = useState(false);
  const [, setMicError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [covGeoBusy, setCovGeoBusy] = useState(false);
  // messageId -> clicked choiceId; greys out a message's choices once used
  const [consumed, setConsumed] = useState<Record<string, string>>({});
  const recorderRef = useRef<MicRecorderControls | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadKindRef = useRef<"id" | "por">("id");

  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const ALLOWED_UPLOAD = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/pdf",
  ]);
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

  const goTopUpWithBundle = useCallback(
    (bundleId: string) => {
      applyBundleGuide(bundleId);
      if (!pathname.includes("/qr_portal/top-up")) {
        router.push("/qr_portal/top-up/data");
      }
    },
    [applyBundleGuide, pathname, router],
  );

  /** Guide only: select SKU on host page and end the assistant mission. */
  const guideSelect = useCallback(
    (bundleId: string) => {
      if (bundleId === "LTE-120GB" || bundleId === "LTE-80GB") {
        void purchaseInChat(bundleId);
        return;
      }
      const portalBundleId = bundleId === "DATA-50GB" ? "DATA-M-50" : bundleId;
      if (getTopUpBundle(portalBundleId)) {
        goTopUpWithBundle(portalBundleId);
        return;
      }
      dismissProactive();
      closeChat();
      setMessages([]);
    },
    [closeChat, dismissProactive, goTopUpWithBundle, purchaseInChat, setMessages],
  );

  const keepSelection = useCallback(() => {
    dismissProactive();
    closeChat();
    setMessages([]);
  }, [closeChat, dismissProactive, setMessages]);

  const onChoice = useCallback(
    (choice: ChatChoice, sourceId?: string) => {
      if (choice.disabled) return;
      if (
        (choice.action === "handoff_online" ||
          choice.action === "handoff_open_chat") &&
        !agentDeskOpen
      ) {
        return;
      }
      // Mark the message's choice as consumed so the buttons grey out.
      if (sourceId) {
        setConsumed((prev) =>
          prev[sourceId] ? prev : { ...prev, [sourceId]: choice.id },
        );
      }
      if (choice.action === "guide_bundle" && choice.payload) {
        goTopUpWithBundle(choice.payload);
        return;
      }
      if (choice.action === "open_store_locator" || choice.action === "sim_find_store") {
        window.open(
          "https://www.telkom.co.za/storelocator",
          "_blank",
          "noopener,noreferrer",
        );
        void handleChatAction(choice.action);
        return;
      }
      if (choice.action === "sim_geo") {
        setGeoBusy(true);
        if (!navigator.geolocation) {
          setGeoBusy(false);
          void handleChatAction("sim_geo_fail");
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGeoBusy(false);
            void handleChatAction(
              "sim_geo",
              `${pos.coords.latitude},${pos.coords.longitude}`,
            );
          },
          () => {
            setGeoBusy(false);
            void handleChatAction("sim_geo_fail");
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 },
        );
        return;
      }
      void handleChatAction(choice.action, choice.payload);
    },
    [agentDeskOpen, goTopUpWithBundle, handleChatAction],
  );

  const onCoverageLocate = useCallback(() => {
    setCovGeoBusy(true);
    if (!navigator.geolocation) {
      setCovGeoBusy(false);
      coverageGeoFailed();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCovGeoBusy(false);
        proposeCoverageByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setCovGeoBusy(false);
        coverageGeoFailed();
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 },
    );
  }, [coverageGeoFailed, proposeCoverageByCoords]);

  const pickUpload = useCallback((kind: "id" | "por", mode: "file" | "camera" = "file") => {
    setUploadError(null);
    uploadKindRef.current = kind;
    if (mode === "camera") {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  }, []);

  const onFilePicked = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setUploadError(null);
      const extOk = /\.(jpe?g|png|webp|pdf|heic)$/i.test(file.name);
      const typeOk =
        ALLOWED_UPLOAD.has(file.type) ||
        (file.type === "" && extOk);
      if (!typeOk && !extOk) {
        setUploadError(
          "Unsupported format. Please upload JPG, PNG, WEBP, or PDF.",
        );
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setUploadError("File too large. Maximum size is 10MB.");
        return;
      }
      setUploadBusy(true);
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        await completeSimDocs(uploadKindRef.current, dataUrl, {
          name: file.name,
          size: file.size,
        });
      } catch (e) {
        setUploadError(
          e instanceof Error ? e.message : "Could not read that file.",
        );
      } finally {
        setUploadBusy(false);
      }
    },
    [completeSimDocs],
  );

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setSending(true);
      setDraft("");
      try {
        if (simActive) {
          const consumed = await advanceSimChat(trimmed);
          if (consumed) return;
          setMessages((prev) => [
            ...prev,
            { id: `u_${Date.now()}`, role: "user", text: trimmed },
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: "Please use the upload buttons or action cards above to continue SIM self-care.",
            },
          ]);
          return;
        }

        if (coverageActive) {
          // Typed "use my current location" → real device geolocation path,
          // same as the LocationInput button.
          if (isDeviceLocationRequest(trimmed)) {
            onCoverageLocate();
            return;
          }
          submitCoverageAddress(trimmed);
          return;
        }

        setMessages((prev) => [
          ...prev,
          { id: `u_${Date.now()}`, role: "user", text: trimmed },
        ]);

        const res = await apiFetch("/api/ai/chat", {
          method: "POST",
          body: JSON.stringify({
            message: trimmed,
            customerId: customer?.id,
          }),
        });
        const data = (await res.json()) as {
          reply?: string;
          error?: string;
          action?: string;
        };
        const reply =
          data.reply ?? data.error ?? "Sorry, I couldn't respond just now.";

        if (data.action === "start_sim") {
          startSimSelfCare({ replace: false });
          return;
        }

        if (data.action === "start_billing") {
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: reply,
            },
          ]);
          await startBillingAssist({ fromEmail: false, replace: false });
          return;
        }

        if (data.action === "start_coverage") {
          const focus = /\b5g\b/i.test(trimmed)
            ? "5g"
            : /\bfib(?:re|er)\b/i.test(trimmed)
              ? "fibre"
              : "any";
          const place = extractCoveragePlace(trimmed);
          if (place && matchKnownCoverageLocation(place)) {
            // Clear, recognisable place — confirm it directly, no re-asking.
            proposeCoverageLocation(place, focus);
          } else {
            // Vague or unknown — go straight to address input / device location.
            startCoverageCheck({
              replace: false,
              skipChooser: true,
              focus,
            });
          }
          return;
        }

        if (data.action === "handoff") {
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: reply,
            },
          ]);
          await handleChatAction("handoff", "Chat enquiry");
          return;
        }

        if (data.action === "show_bundles") {
          if (startDeviceUpgrade({ injectUser: false, replace: false })) {
            return;
          }
          const picks =
            BUNDLE_PICKS.length > 0
              ? BUNDLE_PICKS
              : TOPUP_BUNDLES.slice(0, 5);
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: reply,
              choices: picks.map((b) => ({
                id: b.id,
                label: `${b.volume} ${b.type}`,
                meta: `R${b.price.toFixed(2)} · ${b.product}`,
                action: "guide_bundle",
                payload: b.id,
              })),
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: reply,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Connection issue — please try again.",
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [
      advanceSimChat,
      customer?.currentPlanName,
      customer?.id,
      customer?.name,
      customer?.title,
      handleChatAction,
      sending,
      setMessages,
      simActive,
      coverageActive,
      onCoverageLocate,
      startCoverageCheck,
      submitCoverageAddress,
      startBillingAssist,
      startDeviceUpgrade,
      startSimSelfCare,
    ],
  );

  const toggleMic = useCallback(async () => {
    setMicError(null);
    if (recording && recorderRef.current) {      setRecording(false);
      setAsrBusy(true);
      try {
        const audioDataUrl = await recorderRef.current.stop();
        recorderRef.current = null;
        const res = await apiFetch("/api/ai/transcribe", {
          method: "POST",
          body: JSON.stringify({ audioDataUrl, language: "en" }),
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Transcription failed");
        const text = (data.text ?? "").trim();
        if (text) {
          setDraft(text);
          await sendText(text);
        } else {
          setMicError("No speech detected — try again.");
        }
      } catch (e) {
        setMicError(e instanceof Error ? e.message : "Mic failed");
      } finally {
        setAsrBusy(false);
      }
      return;
    }

    try {
      recorderRef.current = await startMicRecording();
      setRecording(true);
    } catch {
      setMicError("Microphone permission is required for voice input.");
    }
  }, [recording, sendText]);

  const upsellToast = messages.find((m) => m.upsell)?.upsell;
  const deviceToast = messages.find((m) => m.deviceDeal)?.deviceDeal;
  const preferInsightOpen = messages.some((m) => m.showUsagePie);

  return (
    <>
    <div className="chat-assist pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 md:right-[min(28vw,380px)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void onFilePicked(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void onFilePicked(file);
        }}
      />

      <AnimatePresence mode="popLayout">
        {proactiveOpen && !chatOpen && (
          <motion.div
            key="proactive-toast"
            role="status"
            className="chat-assist__toast pointer-events-auto w-[min(340px,calc(100vw-2rem))] rounded-2xl p-4 text-white"
            initial={{ opacity: 0, y: 28, scale: 0.92, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(4px)" }}
            transition={springPop}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {proactiveMessage}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {deviceToast ? (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      openChat();
                    }}
                    className="chat-assist__cta rounded-full bg-[var(--ca-lime)] px-3 py-1.5 text-sm font-semibold text-[var(--ca-ink)] shadow-[0_6px_16px_rgba(145,226,0,0.35)]"
                  >
                    See this deal
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      openChat();
                      void handleChatAction("device_buy_data");
                    }}
                    className="chat-assist__cta rounded-full bg-white/20 px-3 py-1.5 text-sm backdrop-blur-sm"
                  >
                    Just buy data
                  </motion.button>
                </>
              ) : upsellToast && !preferInsightOpen ? (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    disabled={checkoutBusy}
                    onClick={() => guideSelect(upsellToast.upgradeId)}
                    className="chat-assist__cta rounded-full bg-[var(--ca-lime)] px-3 py-1.5 text-sm font-semibold text-[var(--ca-ink)] shadow-[0_6px_16px_rgba(145,226,0,0.35)]"
                  >
                    Get {upsellToast.upgradeLabel}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={keepSelection}
                    className="chat-assist__cta rounded-full bg-white/20 px-3 py-1.5 text-sm backdrop-blur-sm"
                  >
                    Keep {upsellToast.selectedLabel}
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void acceptProactive()}
                    className="chat-assist__cta rounded-full bg-[var(--ca-lime)] px-3 py-1.5 text-sm font-semibold text-[var(--ca-ink)]"
                  >
                    Show me
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={dismissProactive}
                    className="chat-assist__cta rounded-full bg-white/20 px-3 py-1.5 text-sm"
                  >
                    Not now
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="chat-panel"
            className="chat-assist__panel pointer-events-auto flex h-[min(610px,76vh)] w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[26px]"
            role="dialog"
            aria-label="Vodacom assistant"
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={springSoft}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <TobiAvatar alt="TOBi" className="h-10 w-10 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold leading-tight">TOBi</div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[0.65rem]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ca-lime)]" />
                  Online · Vodacom digital assistant
                </div>
              </div>
              <button
                type="button"
                onClick={closeChat}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-lg transition hover:bg-white/30"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3">
              {messages.map((m, idx) => (
                <motion.div
                  key={m.id}
                  className={`flex max-w-[96%] gap-2 ${
                    m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    ...springSoft,
                    delay: Math.min(idx * 0.06, 0.24),
                  }}
                >
                  {m.role !== "user" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <TobiAvatar className="mt-0.5 h-8 w-8 rounded-full" />
                  )}
                  <div
                    className={`chat-assist__bubble rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-white/20"
                        : "bg-white/15 backdrop-blur-sm"
                    }`}
                  >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {m.showUsagePie && (
                    <div className="mt-3">
                      <AppUsagePie />
                    </div>
                  )}

                  {m.showDataUsageChart && (
                    <div className="mt-3">
                      <UpgradeInsightCard />
                    </div>
                  )}

                  {m.deviceDeal && (
                    <DeviceDealCard
                      currentDevice={m.deviceDeal.currentDevice}
                      deviceAgeMonths={m.deviceDeal.deviceAgeMonths}
                      offerName={m.deviceDeal.offerName}
                      brand={m.deviceDeal.brand}
                      monthlyRand={m.deviceDeal.monthlyRand}
                      termMonths={m.deviceDeal.termMonths}
                      specs={m.deviceDeal.specs}
                    />
                  )}

                  {m.handoff && (
                    <div className="mt-3 space-y-1 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ca-blue-deep)]">
                        Agent queue
                      </div>
                      <p className="text-xs">{m.handoff.reason}</p>
                      <ul className="text-[0.7rem] text-[var(--muted)]">
                        {m.handoff.context.map((c) => (
                          <li key={c}>• {c}</li>
                        ))}
                      </ul>
                      <p className="pt-1 text-[0.7rem] font-semibold text-[var(--ca-blue-deep)]">
                        Ticket queued · ETA ~2 min
                      </p>
                    </div>
                  )}

                  {m.simManual && (
                    <div
                      lang="en-ZA"
                      className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]"
                    >
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
                        {m.simManual.title}
                      </div>
                      {m.simManual.body.map((line) => (
                        <p key={line} className="text-xs leading-relaxed">
                          {line}
                        </p>
                      ))}
                      <ul className="space-y-1 pt-1 text-xs">
                        {m.simManual.checks.map((c) => (
                          <li key={c.label} className="flex items-start gap-2">
                            <span
                              className={
                                c.status === "ok"
                                  ? "font-bold text-emerald-600"
                                  : "font-bold text-amber-600"
                              }
                            >
                              {c.status === "ok" ? "✓" : "⚠"}
                            </span>
                            <span>{c.label}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-[var(--line)] pt-2">
                        <div className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                          Recommended
                        </div>
                        <div className="text-sm font-semibold text-[var(--ca-blue-deep)]">
                          {m.simManual.recommended}
                        </div>
                      </div>
                    </div>
                  )}

                  {m.nearbyStores && m.nearbyStores.length > 0 && (
                    <div
                      lang="en-ZA"
                      className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]"
                    >
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
                        Nearby Vodacom Stores
                      </div>
                      {m.nearbyStores.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-start justify-between gap-2 border-t border-[var(--line)] pt-2 first:border-t-0 first:pt-0"
                        >
                          <div>
                            <div className="text-xs font-semibold">
                              📍 {s.name.replace(/^Vodacom\s+/i, "")}
                            </div>
                            <div className="text-[0.7rem] text-[var(--muted)]">
                              {typeof s.distanceKm === "number"
                                ? `${s.distanceKm} km`
                                : s.address}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                void handleChatAction("sim_store", s.id)
                              }
                              className="rounded-full bg-[var(--ca-blue)] px-2.5 py-1 text-[0.65rem] font-semibold text-white"
                            >
                              Collect here
                            </button>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-[var(--ca-blue)] px-2.5 py-1 text-center text-[0.65rem] font-semibold text-[var(--ca-blue-deep)]"
                            >
                              Directions
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.careOffer && (
                    <div
                      lang="en-ZA"
                      className="mt-3 space-y-1 rounded-xl bg-white p-3 text-[var(--ca-ink)]"
                    >
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
                        Customer Care
                      </div>
                      <p className="text-sm font-semibold">{m.careOffer.phone}</p>
                      <p className="text-[0.7rem] text-[var(--muted)]">
                        Issue: {m.careOffer.issue}
                      </p>
                    </div>
                  )}

                  {m.callbackForm && (
                    <CallbackRequestWidget
                      reason={m.callbackForm.reason}
                      defaultNumber={m.callbackForm.defaultNumber}
                      disabled={sending}
                      onSubmit={(values) => {
                        void handleChatAction(
                          "submit_callback",
                          JSON.stringify(values),
                        );
                      }}
                    />
                  )}

                  {m.uploadedFile && (
                    <div className="mt-3 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold">
                            {m.uploadedFile.name}
                          </div>
                          <div className="text-[0.7rem] text-[var(--muted)]">
                            {m.uploadedFile.sizeLabel}
                          </div>
                        </div>
                        <span className="text-[0.65rem] font-bold text-emerald-600">
                          Uploaded ✓
                        </span>
                      </div>
                      <button
                        type="button"
                        className="mt-2 text-[0.7rem] font-semibold text-[var(--ca-blue)]"
                        onClick={() => pickUpload(m.uploadedFile!.kind)}
                      >
                        Replace file
                      </button>
                    </div>
                  )}

                  {m.verifyProgress && (
                    <div className="mt-3 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-[var(--ca-blue-deep)]">
                          {m.verifyProgress.title}
                        </div>
                        {m.attemptBadge && (
                          <span className="rounded-full bg-[#ffe8e8] px-2 py-0.5 text-[0.65rem] font-bold text-[#b42318]">
                            Attempt {m.attemptBadge.current}/{m.attemptBadge.max}
                          </span>
                        )}
                      </div>
                      <ol className="mt-2 space-y-1.5">
                        {m.verifyProgress.steps.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center gap-2 text-[0.75rem]"
                          >
                            <span
                              className={
                                s.state === "failed"
                                  ? "font-bold text-red-600"
                                  : s.state === "done"
                                    ? "text-emerald-600"
                                    : s.state === "active"
                                      ? "text-[var(--ca-blue)]"
                                      : "text-[var(--muted)]"
                              }
                            >
                              {s.state === "failed"
                                ? "❌"
                                : s.state === "done"
                                  ? "✓"
                                  : s.state === "active"
                                    ? "●"
                                    : "○"}
                            </span>
                            <span
                              className={
                                s.state === "pending"
                                  ? "text-[var(--muted)]"
                                  : s.state === "failed"
                                    ? "text-red-700"
                                    : ""
                              }
                            >
                              {s.label}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {m.attemptBadge && !m.verifyProgress && (
                    <div className="mt-2 inline-flex rounded-full bg-[#ffe8e8] px-2.5 py-0.5 text-[0.65rem] font-bold text-[#b42318]">
                      Attempt {m.attemptBadge.current}/{m.attemptBadge.max}
                    </div>
                  )}

                  {m.verifyResult && (
                    <div className="mt-3 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
                      <div className="text-xs font-bold text-[var(--ca-blue-deep)]">
                        {m.verifyResult.title}
                      </div>
                      <ul className="mt-2 space-y-1">
                        {m.verifyResult.fields.map((f) => (
                          <li
                            key={f.label}
                            className="flex justify-between gap-2 text-[0.75rem]"
                          >
                            <span className="text-[var(--muted)]">{f.label}</span>
                            <span className="font-semibold">
                              {f.ok ? "✓ " : ""}
                              {f.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.uploadCard && (
                    <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
                      <div className="text-xs font-bold text-[var(--ca-blue-deep)]">
                        {m.uploadCard.title}
                      </div>
                      <p className="text-[0.75rem] text-[var(--muted)]">
                        {m.uploadCard.body}
                      </p>
                      <div className="rounded-lg border border-dashed border-[var(--ca-blue)]/40 bg-[#f3f9ff] px-3 py-3">
                        <div className="text-[0.7rem] font-semibold text-[var(--ca-blue-deep)]">
                          {m.uploadCard.kind === "id"
                            ? "ID Document (Passport / ID Card)"
                            : "Proof of Residence"}
                        </div>
                        <p className="mt-1 text-[0.7rem] text-[var(--muted)]">
                          Take a photo or upload a file
                        </p>
                        <div className="mt-2 flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={uploadBusy}
                            onClick={() => pickUpload(m.uploadCard!.kind, "camera")}
                            className="chat-assist__cta rounded-full bg-[var(--ca-blue)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {uploadBusy ? "Uploading…" : "Take Photo"}
                          </button>
                          <button
                            type="button"
                            disabled={uploadBusy}
                            onClick={() => pickUpload(m.uploadCard!.kind, "file")}
                            className="chat-assist__cta rounded-full border border-[var(--ca-blue)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ca-blue-deep)] disabled:opacity-50"
                          >
                            {uploadBusy ? "Uploading…" : "Upload File"}
                          </button>
                        </div>
                      </div>
                      <p className="text-[0.65rem] text-[var(--muted)]">
                        Accepted: JPG, PNG, PDF · Max 10MB
                      </p>
                      <p className="text-[0.65rem] text-[var(--muted)]">
                        Your documents are secure and only used for verification.
                      </p>
                    </div>
                  )}

                  {m.uploadSlots &&
                    m.uploadSlots.length > 0 &&
                    !m.uploadCard && (
                    <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
                      <div className="flex flex-col gap-2">
                        {m.uploadSlots.includes("id") && (
                          <button
                            type="button"
                            disabled={uploadBusy}
                            onClick={() => pickUpload("id")}
                            className="chat-assist__cta rounded-full bg-[var(--ca-blue)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Upload passport / ID
                          </button>
                        )}
                        {m.uploadSlots.includes("por") && (
                          <button
                            type="button"
                            disabled={uploadBusy}
                            onClick={() => pickUpload("por")}
                            className="chat-assist__cta rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          >
                            Upload proof of residence
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {m.verifiedOk && (
                    <motion.div
                      className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[var(--ca-ink)]"
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={springPop}
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#91e200] text-lg font-bold text-[#002e4d]">
                        ✓
                      </span>
                      <span className="text-xs font-semibold leading-snug">
                        {m.okBadge ?? "Verification complete"}
                      </span>
                    </motion.div>
                  )}

                  {m.inputWidget && (
                    <SimInputWidget
                      kind={m.inputWidget.kind}
                      prefill={m.inputWidget.prefill}
                      label={m.inputWidget.label}
                      disabled={sending}
                      onConfirm={(value) => {
                        void (async () => {
                          setSending(true);
                          try {
                            await advanceSimChat(value, {
                              confirmed: true,
                              silent: true,
                            });
                          } finally {
                            setSending(false);
                          }
                        })();
                      }}
                    />
                  )}

                  {m.locationInput && (
                    <LocationInput
                      placeholder={m.locationInput.placeholder}
                      suggestions={m.locationInput.suggestions}
                      disabled={sending || coverageState.step !== "ask_location"}
                      onSubmit={(value) => submitCoverageAddress(value)}
                      onLocate={onCoverageLocate}
                      locateBusy={covGeoBusy}
                    />
                  )}

                  {m.locationCard && (
                    <LocationCard
                      location={m.locationCard}
                      disabled={
                        sending || coverageState.step !== "location_entered"
                      }
                      onRelocate={adjustCoverageLocation}
                      onConfirm={() =>
                        void handleChatAction("coverage_confirm")
                      }
                    />
                  )}

                  {m.coverageChecking && (
                    <CoverageChecking address={m.coverageChecking.address} />
                  )}

                  {m.coverageResult && (
                    <CoverageResult
                      address={m.coverageResult.address}
                      line1={m.coverageResult.line1}
                      suburb={m.coverageResult.suburb}
                      city={m.coverageResult.city}
                      result={m.coverageResult.result}
                    />
                  )}

                  {m.coverageFallback && (
                    <CoverageFallback
                      kind={m.coverageFallback.kind}
                      onRetry={
                        m.coverageFallback.kind === "error"
                          ? () => void handleChatAction("coverage_retry")
                          : undefined
                      }
                      onBack={() => void handleChatAction("coverage_back")}
                    />
                  )}

                  {m.agentBrief && (
                    <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
                        Passed to the agent
                      </div>
                      <p className="text-[0.7rem] font-semibold">
                        Reference {m.agentBrief.reference}
                      </p>
                      <p className="text-xs leading-relaxed">
                        {m.agentBrief.summary}
                      </p>
                      <div>
                        <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
                          What the agent should do
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed">
                          {m.agentBrief.requestedAction}
                        </p>
                      </div>
                      {m.agentBrief.lastTurns.length > 0 && (
                        <div>
                          <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
                            Recent chat
                          </div>
                          <ul className="mt-1 space-y-0.5 text-[0.7rem] leading-snug text-[var(--muted)]">
                            {m.agentBrief.lastTurns.map((t, i) => (
                              <li key={`${i}-${t.slice(0, 20)}`}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {m.storeHandoff && (
                    <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
                        Store staff brief
                      </div>
                      <div className="flex justify-between gap-2 text-xs">
                        <span>Branch</span>
                        <span className="text-right font-semibold">
                          {m.storeHandoff.storeName}
                        </span>
                      </div>
                      {m.storeHandoff.address ? (
                        <div className="flex justify-between gap-2 text-xs text-[var(--muted)]">
                          <span>Address</span>
                          <span className="text-right">
                            {m.storeHandoff.address}
                          </span>
                        </div>
                      ) : null}
                      <div className="border-t border-[var(--line)] pt-2 text-xs font-semibold">
                        Reference {m.storeHandoff.reference}
                      </div>
                      <p className="text-[0.7rem] text-[var(--muted)]">
                        Staff notified. Bring your ID — no chat payment / OTP.
                      </p>
                    </div>
                  )}

                  {m.choices && m.choices.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.choices.map((c) => {
                        const offlineDesk =
                          (c.action === "handoff_online" ||
                            c.action === "handoff_open_chat") &&
                          !agentDeskOpen;
                        const picked = consumed[m.id] === c.id;
                        const consumedOther =
                          Boolean(consumed[m.id]) && !picked;
                        const disabled =
                          Boolean(c.disabled) ||
                          geoBusy ||
                          offlineDesk ||
                          consumedOther;
                        const variant = c.variant;
                        const base =
                          "chat-assist__cta block w-full px-3 py-2.5 text-left text-xs font-semibold transition";
                        let styles: string;
                        if (picked) {
                          // the one the user tapped — stays visible but inert
                          styles =
                            "cursor-default rounded-xl border border-[var(--ca-lime)]/60 bg-[var(--ca-lime)]/15 text-white/85";
                        } else if (disabled) {
                          styles =
                            "cursor-not-allowed rounded-xl border border-dashed border-white/25 bg-white/10 text-white/45";
                        } else if (variant === "primary") {
                          styles =
                            "rounded-full bg-[var(--ca-lime)] text-[var(--ca-ink)] shadow-[0_6px_16px_rgba(145,226,0,0.4)]";
                        } else if (variant === "secondary") {
                          styles =
                            "rounded-full bg-white/20 text-white backdrop-blur-sm";
                        } else if (variant === "ghost") {
                          styles =
                            "rounded-full border border-white/30 bg-transparent text-white/90";
                        } else {
                          styles = "rounded-xl bg-white text-[var(--ca-ink)]";
                        }
                        const metaMuted =
                          picked
                            ? "text-white/60"
                            : disabled
                            ? "text-white/35"
                            : variant === "primary"
                              ? "text-[var(--ca-ink)]/65"
                              : variant === "secondary" || variant === "ghost"
                                ? "text-white/70"
                                : "text-[var(--muted)]";
                        return (
                          <div key={c.id} className="group/hours relative">
                            <button
                              type="button"
                              disabled={disabled || picked}
                              aria-label={offlineDesk ? AGENT_OFFLINE_HINT : undefined}
                              onClick={() => onChoice(c, m.id)}
                              className={`${base} ${styles}`}
                            >
                              <span className="block">
                                {picked ? `✓ ${c.label}` : c.label}
                              </span>
                              {(c.meta || offlineDesk) && (
                                <span
                                  className={`mt-0.5 block font-normal ${metaMuted}`}
                                >
                                  {offlineDesk ? "Offline now" : c.meta}
                                </span>
                              )}
                            </button>
                            {offlineDesk && (
                              <div className="mt-1.5 hidden rounded-xl bg-white p-2.5 text-[var(--ca-ink)] shadow-[0_8px_20px_rgba(0,46,77,0.16)] group-hover/hours:block">
                                <p className="text-xs font-semibold leading-snug">
                                  Sorry — online agents are offline right now.
                                </p>
                                <ul className="mt-1.5 space-y-0.5 text-[0.7rem] leading-snug text-[var(--muted)]">
                                  {AGENT_HOURS_LINES.map((line) => (
                                    <li key={line}>{line}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {m.upsell && (
                    <motion.div
                      className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)] shadow-[0_8px_24px_rgba(0,46,77,0.1)]"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, ...springSoft }}
                    >
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ca-blue-deep)]">
                        Before you go
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        +R{m.upsell.deltaPrice.toFixed(2)} ·{" "}
                        {m.upsell.selectedLabel} → {m.upsell.upgradeLabel}
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={checkoutBusy}
                          onClick={() => guideSelect(m.upsell!.upgradeId)}
                          className="chat-assist__cta rounded-full bg-[var(--ca-blue)] px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(10,151,255,0.35)]"
                        >
                          Get {m.upsell.upgradeLabel}
                        </button>
                        <button
                          type="button"
                          onClick={keepSelection}
                          className="chat-assist__cta rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold"
                        >
                          Keep {m.upsell.selectedLabel}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {m.compareRows && m.compareRows.length > 0 && (
                    <motion.div
                      className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12, ...springSoft }}
                    >
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ca-blue-deep)]">
                        Compare here
                      </div>
                      {m.compareRows.map((row, ri) => (
                        <motion.div
                          key={row.id}
                          className={`rounded-lg border px-2 py-2 text-xs ${
                            row.recommended
                              ? "border-[var(--ca-blue)] bg-[#e8f5ff]"
                              : "border-[var(--line)]"
                          }`}
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.08 + ri * 0.05 }}
                        >
                          <div className="flex justify-between gap-2 font-semibold">
                            <span>{row.title}</span>
                            <span>R{row.price.toFixed(2)}</span>
                          </div>
                          <div className="text-[var(--muted)]">{row.meta}</div>
                          {row.recommended && (
                            <div className="mt-1 text-[var(--ca-blue-deep)]">
                              Suggested
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {(m.guideBundleId || m.buyProductId) && (
                        <button
                          type="button"
                          onClick={() =>
                            guideSelect(m.guideBundleId ?? m.buyProductId!)
                          }
                          className="chat-assist__cta mt-1 w-full rounded-full bg-[var(--ca-blue)] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Select suggested on page
                        </button>
                      )}
                    </motion.div>
                  )}

                  {m.recommendation && (
                    <motion.div
                      className="mt-3 rounded-xl bg-white p-3 text-[var(--ca-ink)]"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, ...springSoft }}
                    >
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ca-blue-deep)]">
                        Recommended
                      </div>
                      <div className="mt-1 font-semibold">
                        {m.recommendation.name}
                      </div>
                      <div className="text-sm text-[var(--muted)]">
                        R{m.recommendation.price} ·{" "}
                        {m.recommendation.validityDays} days
                      </div>
                      <ul className="mt-2 space-y-1 text-xs">
                        {(m.reasons ?? []).map((r) => (
                          <li key={r}>✓ {r}</li>
                        ))}
                        {m.benefit && (
                          <li>✓ Est. benefit: {m.benefit}/month</li>
                        )}
                      </ul>
                      <button
                        type="button"
                        onClick={() => guideSelect(m.recommendation!.id)}
                        className="chat-assist__cta mt-3 rounded-full bg-[var(--ca-blue)] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Select on page
                      </button>
                    </motion.div>
                  )}

                  {!m.compareRows &&
                    !m.recommendation &&
                    !m.upsell &&
                    !m.choices &&
                    (m.guideBundleId || m.buyProductId) && (
                      <button
                        type="button"
                        onClick={() =>
                          guideSelect(m.guideBundleId ?? m.buyProductId!)
                        }
                        className="chat-assist__cta mt-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ca-ink)]"
                      >
                        Select on page
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {messages.length === 0 && (
                <div className="flex max-w-[96%] flex-col gap-2">
                  <div className="flex gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <TobiAvatar className="mt-0.5 h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <p className="rounded-2xl bg-white/15 px-3 py-2 text-sm leading-relaxed">
                        Hi
                        {customer ? ` ${customer.name.split(/\s+/)[0]}` : ""}{" "}
                        👋. Pick a topic or type a message.
                      </p>
                      <div className="space-y-2">
                        {(
                          [
                            {
                              id: "m0",
                              label: "Top-up / upgrade packages",
                              meta: "Once-off bundles & plan upgrades",
                              action: "menu_bundles",
                            },
                            {
                              id: "m1",
                              label: "SIM self-care",
                              meta: "Lost / replace / suspend",
                              action: "menu_sim",
                            },
                            {
                              id: "m2",
                              label: "Billing",
                              meta: "Explain bill · invoices",
                              action: "menu_billing",
                            },
                            {
                              id: "m-cov",
                              label: "Check coverage",
                              meta: "5G, LTE and Fibre at an address",
                              action: "menu_coverage",
                            },
                            {
                              id: "m3",
                              label: "Talk to an agent",
                              meta: "Online chat · callback · 081 180",
                              action: "menu_agent",
                            },
                            {
                              id: "m4",
                              label: "Ask a FAQ",
                              meta: "Type any Vodacom question below",
                              action: "menu_faq",
                            },
                          ] as ChatChoice[]
                        ).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => onChoice(c)}
                            className="chat-assist__cta block w-full rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold text-[var(--ca-ink)]"
                          >
                            <span className="block">{c.label}</span>
                            {c.meta && (
                              <span className="mt-0.5 block font-normal text-[var(--muted)]">
                                {c.meta}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {(asrBusy || sending) && (
                <div className="flex items-center gap-2 text-xs opacity-80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <TobiAvatar className="h-7 w-7 rounded-full" />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {asrBusy ? "Transcribing…" : "Typing…"}
                  </motion.p>
                </div>
              )}
              {uploadError && (
                <p className="text-xs text-amber-200">{uploadError}</p>
              )}
              {uploadBusy && (
                <p className="text-xs opacity-80">Uploading document…</p>
              )}
            </div>

            <form
              className="p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void sendText(draft);
              }}
            >
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[var(--ca-ink)] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                  placeholder={
                    recording
                      ? "Recording… tap mic to stop"
                      : coverageState.step === "checking"
                        ? "Checking coverage…"
                        : simActive
                          ? "Reply to continue SIM…"
                          : "Type a message…"
                  }
                  aria-label="Message"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={
                    sending ||
                    recording ||
                    asrBusy ||
                    coverageState.step === "checking"
                  }
                />
                <button
                  type="button"
                  title={recording ? "Stop and transcribe" : "Voice input"}
                  onClick={() => void toggleMic()}
                  disabled={sending || asrBusy}
                  className={`grid h-8 w-8 place-items-center rounded-full text-sm transition ${
                    recording
                      ? "animate-pulse bg-red-500 text-white"
                      : "bg-[var(--line)] hover:bg-[#d5dde4]"
                  }`}
                >
                  🎙
                </button>
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="chat-assist__cta rounded-full bg-[var(--ca-blue)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            key="fab"
            type="button"
            onClick={openChat}
            className="chat-assist__fab pointer-events-auto"
            aria-label="Open Vodacom assistant"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={springPop}
          >
            <TobiAvatar alt="Open TOBi" className="h-full w-full rounded-[22px]" />
          </motion.button>
        )}
      </AnimatePresence>

      <span className="hidden">{recommendedProduct?.id}</span>
    </div>
    </>
  );
}
