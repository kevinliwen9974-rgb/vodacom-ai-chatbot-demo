import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDashScopeConfig, dashscopeChat } from "@/lib/ai/dashscope";
import { getCustomer } from "@/data/customers";
import { getKycMode, getKycPdfPaths } from "@/lib/kyc/store";
import { toVisionImageDataUrl } from "@/lib/kyc/pdf-to-image";
import { downscaleVisionDataUrl } from "@/lib/kyc/downscale";
import { ensureSessionIdFromHeader } from "@/lib/api/session";
import { getOrCreateSession } from "@/lib/store/session";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { parseJsonObject } from "@/lib/ai/chat-prompts";

export const runtime = "nodejs";
export const maxDuration = 120;

const BodySchema = z.object({
  customerId: z.string().optional(),
  stage: z.enum(["id", "por"]).default("id"),
  idDataUrl: z.string().min(32).optional(),
  porDataUrl: z.string().min(32).optional(),
});

/** Process-local CRM JPEG cache (path → data URL). */
const crmImageCache = new Map<string, string>();

function sanitizeCustomerFacing(msg: string): string {
  return msg
    .replace(/\bQwen[\w.-]*/gi, "our verification service")
    .replace(/\bDashScope\b/gi, "our verification service")
    .replace(/\bInternalError\.Algo\.[A-Za-z]+/g, "verification error")
    .replace(/The image format is illegal[^.]*\.?/gi, "we couldn't open that file.")
    .slice(0, 400);
}

function normalizeId(v: string): string {
  return v.replace(/[\s\-]/g, "").toUpperCase();
}

function nameTokens(v: string): string[] {
  return v
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function namesLooselyMatch(a: string, b: string): boolean {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return true;
  const setB = new Set(tb);
  const hits = ta.filter((t) => setB.has(t)).length;
  return hits >= Math.min(2, ta.length);
}

function addressTokens(v: string): string[] {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 1 &&
        !["the", "road", "street", "avenue"].includes(token),
    );
}

function addressesLooselyMatch(extracted: string, expected: string): boolean {
  const actual = new Set(addressTokens(extracted));
  const wanted = addressTokens(expected);
  if (!actual.size || wanted.length < 2) return false;
  return (
    wanted.filter((token) => actual.has(token)).length >=
    Math.min(3, wanted.length)
  );
}

function dataUrlHash(dataUrl: string): string | null {
  const comma = dataUrl.indexOf(",");
  if (comma < 0 || !/;base64/i.test(dataUrl.slice(0, comma))) return null;
  try {
    return createHash("sha256")
      .update(Buffer.from(dataUrl.slice(comma + 1), "base64"))
      .digest("hex");
  } catch {
    return null;
  }
}

async function crmVisionUrl(filePath: string): Promise<string> {
  const hit = crmImageCache.get(filePath);
  if (hit) return hit;
  const raw = toVisionImageDataUrl(readFileSync(filePath));
  const scaled = await downscaleVisionDataUrl(raw);
  crmImageCache.set(filePath, scaled);
  return scaled;
}

export async function POST(req: NextRequest) {
  const tAll = performance.now();
  const timings: Record<string, number | string> = {};
  const mark = (key: string, since: number) => {
    timings[key] = Math.round(performance.now() - since);
  };

  try {
    const tParse = performance.now();
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    mark("parseBodyMs", tParse);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const sessionId = ensureSessionIdFromHeader(req.headers.get("x-session-id"));
    const session = getOrCreateSession(sessionId);
    const customerId = parsed.data.customerId ?? session.customerId;
    const customer = getCustomer(customerId);

    if (!customer) {
      return NextResponse.json({ error: "Unknown customer" }, { status: 400 });
    }

    if (getKycMode(customer) === "reject") {
      return NextResponse.json({
        match: false,
        reasons: [
          "We can't complete this check on your current profile. Please try again from the correct account.",
        ],
        extracted: {},
        summary: "Verification isn't available for this account.",
      });
    }

    const stage = parsed.data.stage;
    const paths = getKycPdfPaths(customer.id);
    if (!paths && stage === "por") {
      return NextResponse.json({
        match: false,
        reasons: ["We couldn't find your documents on file."],
        extracted: {},
        summary: "Reference documents are missing.",
      });
    }

    if (stage === "id" && !parsed.data.idDataUrl) {
      return NextResponse.json({ error: "ID document required" }, { status: 400 });
    }
    if (stage === "por" && !parsed.data.porDataUrl) {
      return NextResponse.json({ error: "Proof of residence required" }, { status: 400 });
    }

    let userImg: string;
    let crmImg: string;
    try {
      const tPrep = performance.now();
      if (stage === "id") {
        const tUser = performance.now();
        userImg = await downscaleVisionDataUrl(
          toVisionImageDataUrl(parsed.data.idDataUrl!),
        );
        mark("userImagePrepMs", tUser);
        const tCrm = performance.now();
        crmImg = paths ? await crmVisionUrl(paths.passportOrId) : "";
        mark("crmImagePrepMs", tCrm);
      } else {
        const tUser = performance.now();
        userImg = await downscaleVisionDataUrl(
          toVisionImageDataUrl(parsed.data.porDataUrl!),
        );
        mark("userImagePrepMs", tUser);
        const tCrm = performance.now();
        crmImg = await crmVisionUrl(paths!.proofOfResidence);
        mark("crmImagePrepMs", tCrm);
      }
      mark("imagePrepTotalMs", tPrep);
      timings.userImgChars = userImg.length;
      timings.crmImgChars = crmImg.length;
    } catch (convErr) {
      const message =
        convErr instanceof Error
          ? convErr.message
          : "We couldn't prepare that document.";
      return NextResponse.json({
        match: false,
        reasons: [message],
        extracted: {},
        summary: message,
        fallback: true,
        timings: { ...timings, totalMs: Math.round(performance.now() - tAll) },
      });
    }

    const { visionModel } = getDashScopeConfig();
    const prompt =
      stage === "id" && !paths
        ? `You are a Vodacom South Africa document recognition service.

Inspect the uploaded image only.
1) isOfficialIdDocument=true ONLY for a real South African green-book ID, smart ID card, or passport biodata page with official layout, photo and security/document fields.
2) Reject screenshots of typed text, selfies, utility bills and unofficial documents.
3) Extract fields exactly as visible. Prefer the MRZ for passport numbers.

Reply JSON ONLY:
{"isOfficialIdDocument":boolean,"match":false,"extracted":{"fullName":"...","idNumber":"...","dateOfBirth":"...","documentType":"Passport|SA_ID|Smart_ID|Other|Not_ID"},"reasons":[],"summary":"one short customer-facing sentence","confidence":0-1}
The server, not the model, decides the identity match against the customer account.
Never name AI models or vendors.`
        : stage === "id"
        ? `You are a Vodacom South Africa KYC officer.

Image 1 = customer record on file (passport or national ID).
Image 2 = customer upload.

STRICT RULES:
1) isOfficialIdDocument=true ONLY if Image 2 is a real South African green-book ID, smart ID card, or a passport biodata page (any country) with MRZ/photo/layout of an official travel/ID document.
2) Reject notebooks, screenshots of typed text, selfies alone, utility bills, or any photo that merely contains correct-looking text but is NOT an official ID/passport.
3) samePersonAsRecord=true if Image 2 is the SAME person as Image 1 (matching photo/name/DOB). Document number may differ; the server still requires the passport/ID number on file to match.
4) Extract fields from Image 2 only. Prefer MRZ for passport number when the visual field is glare-obscured.

Reply JSON ONLY:
{"isOfficialIdDocument":boolean,"samePersonAsRecord":boolean,"match":boolean,"extracted":{"fullName":"...","idNumber":"...","dateOfBirth":"...","documentType":"Passport|SA_ID|Smart_ID|Other|Not_ID"},"reasons":["customer-safe reasons"],"summary":"one short customer-facing sentence","confidence":0-1}
Set match=true only if isOfficialIdDocument AND same person signals AND extracted idNumber looks present. The server enforces exact ID match against the account.
Never name AI models or vendors.`
        : `You are a Vodacom South Africa KYC officer.

Image 1 = proof of residence on file.
Image 2 = customer upload.

STRICT RULES:
1) isProofOfResidence=true ONLY if Image 2 is a utility bill, bank statement, lease, or official address letter — not an ID/passport and not a random photo of typed address text.
2) samePersonOrAddress=true ONLY if the name/address aligns with Image 1 (same household/person).
3) Reject unrelated documents even if they look "official".

Reply JSON ONLY:
{"isProofOfResidence":boolean,"samePersonOrAddress":boolean,"match":boolean,"extracted":{"fullName":"...","addressHint":"...","documentType":"Proof of residence|Other"},"reasons":[],"summary":"one short customer-facing sentence","confidence":0-1}
Set match=true only if isProofOfResidence AND samePersonOrAddress.
Never name AI models or vendors.`;

    const tVision = performance.now();
    const raw = await dashscopeChat({
      model: visionModel,
      messages: [
        {
          role: "user",
          content: paths
            ? [
                { type: "text", text: prompt },
                { type: "text", text: "Record on file:" },
                { type: "image_url", image_url: { url: crmImg } },
                { type: "text", text: "Customer upload:" },
                { type: "image_url", image_url: { url: userImg } },
              ]
            : [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: userImg } },
              ],
        },
      ],
      temperature: 0.05,
      enableThinking: false,
    });
    mark("visionMs", tVision);
    timings.visionModel = visionModel;

    type VisionResult = {
      match?: boolean;
      isOfficialIdDocument?: boolean;
      samePersonAsRecord?: boolean;
      isProofOfResidence?: boolean;
      samePersonOrAddress?: boolean;
      reasons?: string[];
      extracted?: Record<string, unknown>;
      summary?: string;
      confidence?: number;
    };

    const tGate = performance.now();
    let parsedJson: VisionResult = {};
    const obj = parseJsonObject(raw);
    if (obj) parsedJson = obj as VisionResult;
    else {
      parsedJson = {
        match: false,
        reasons: ["We couldn't complete verification just now."],
        summary: "Please try uploading again.",
      };
    }

    const extracted = parsedJson.extracted ?? {};
    const reasons = [...(parsedJson.reasons ?? [])].map(String);
    let match = Boolean(parsedJson.match);

    if (stage === "id") {
      const official = Boolean(parsedJson.isOfficialIdDocument);
      const samePerson = Boolean(parsedJson.samePersonAsRecord);
      const docType = String(extracted.documentType ?? "");
      const extractedId = normalizeId(String(extracted.idNumber ?? ""));
      const expectedId = normalizeId(customer.idNumber);
      const extractedName = String(extracted.fullName ?? "");
      const nameOk = namesLooselyMatch(extractedName, customer.name);
      const idExact =
        Boolean(extractedId) &&
        Boolean(expectedId) &&
        extractedId === expectedId;

      if (!official || /not_id|other/i.test(docType)) {
        match = false;
        reasons.push(
          "Please upload a clear photo of your passport biodata page or South African ID — not a screenshot or typed note.",
        );
      } else if (!nameOk && extractedName) {
        match = false;
        reasons.push(
          "The name on the document doesn't match your Vodacom account.",
        );
      } else if (!idExact) {
        // Passport/ID number must match account of record — no aliases, no samePerson bypass
        match = false;
        reasons.push(
          "The document number doesn't match the identity on your Vodacom account.",
        );
      } else if (idExact && nameOk && (samePerson || official)) {
        match = true;
      } else {
        match = false;
        reasons.push(
          "We couldn't confirm this document belongs to the account holder.",
        );
      }

      if (match) {
        reasons.length = 0;
      }
    } else {
      const extractedAddress = String(extracted.addressHint ?? "");
      const exactReferenceUpload = Boolean(
        paths &&
          dataUrlHash(parsed.data.porDataUrl!) ===
            createHash("sha256")
              .update(readFileSync(paths.proofOfResidence))
              .digest("hex"),
      );
      const sameAddr =
        exactReferenceUpload ||
        Boolean(parsedJson.samePersonOrAddress) ||
        addressesLooselyMatch(extractedAddress, customer.residentialAddress);
      const isPor = exactReferenceUpload || Boolean(parsedJson.isProofOfResidence);
      if (!isPor) {
        match = false;
        reasons.push(
          "Please upload a proof of residence (utility bill, bank statement, or lease) showing your name and address.",
        );
      }
      if (!sameAddr) {
        match = false;
        reasons.push(
          "We couldn't match this address document to the details on your account.",
        );
      }
      match = isPor && sameAddr;
      if (match) reasons.length = 0;
    }

    mark("serverGateMs", tGate);
    timings.totalMs = Math.round(performance.now() - tAll);
    console.info("[verify-id]", stage, customer.id, timings);

    return NextResponse.json({
      match,
      stage,
      reasons: reasons.map(sanitizeCustomerFacing),
      extracted,
      summary: sanitizeCustomerFacing(
        parsedJson.summary ??
          (match
            ? "Your document looks good."
            : "We couldn't match this document to your account."),
      ),
      confidence: parsedJson.confidence,
      timings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.info("[verify-id] error", {
      ...timings,
      totalMs: Math.round(performance.now() - tAll),
      message,
    });
    return NextResponse.json({
      match: false,
      reasons: [sanitizeCustomerFacing(message)],
      extracted: {},
      summary: "We couldn't verify that document right now. Please try again.",
      fallback: true,
      timings: { ...timings, totalMs: Math.round(performance.now() - tAll) },
    });
  }
}
