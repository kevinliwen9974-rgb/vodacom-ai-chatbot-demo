import { join } from "path";
import { readFileSync, existsSync } from "fs";
import type { Customer } from "@/types";

export type KycMode = "compare" | "reject";

export function getKycMode(customer: Customer): KycMode {
  return customer.kycMode ?? "compare";
}

/** Absolute paths to CRM-scanned KYC documents for a demo customer. */
export function getKycPdfPaths(customerId: string): {
  passportOrId: string;
  proofOfResidence: string;
} | null {
  const root = join(process.cwd(), "data/kyc", customerId === "thandi" ? "shen" : customerId);
  const passportPdf = join(
    root,
    customerId === "sipho" ? "id-mock.pdf" : "passport.pdf",
  );
  const passportImage = join(root, "passport.jpg");
  const passportOrId = existsSync(passportImage) ? passportImage : passportPdf;
  const proofStem = customerId === "sipho"
    ? "proof-of-residence-mock"
    : "proof-of-residence";
  const proofOfResidence = ["png", "jpg", "jpeg", "pdf"]
    .map((ext) => join(root, `${proofStem}.${ext}`))
    .find(existsSync);
  if (!existsSync(passportOrId) || !proofOfResidence) {
    return null;
  }
  return { passportOrId, proofOfResidence };
}

export function pdfToDataUrl(filePath: string): string {
  const buf = readFileSync(filePath);
  const b64 = buf.toString("base64");
  return `data:application/pdf;base64,${b64}`;
}
