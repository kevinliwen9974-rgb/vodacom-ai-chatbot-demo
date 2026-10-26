/**
 * Convert PDF data URLs / files to image data URLs for vision APIs
 * that reject PDF (e.g. DashScope image_url). Prefers embedded scan JPEGs.
 */

function parseDataUrl(dataUrl: string): { mime: string; buf: Buffer } | null {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(dataUrl);
  if (!m) return null;
  const mime = (m[1] || "application/octet-stream").toLowerCase();
  const isB64 = Boolean(m[2]);
  const payload = m[3] ?? "";
  const buf = isB64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return { mime, buf };
}

function extractEmbeddedImages(buf: Buffer): Buffer[] {
  const out: Buffer[] = [];
  // JPEG
  let i = 0;
  while (i < buf.length) {
    const start = buf.indexOf(Buffer.from([0xff, 0xd8, 0xff]), i);
    if (start < 0) break;
    const end = buf.indexOf(Buffer.from([0xff, 0xd9]), start);
    if (end < 0) break;
    const chunk = buf.subarray(start, end + 2);
    if (chunk.length > 4000) out.push(Buffer.from(chunk));
    i = end + 2;
  }
  // PNG
  i = 0;
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  while (i < buf.length) {
    const start = buf.indexOf(pngSig, i);
    if (start < 0) break;
    const iend = buf.indexOf(Buffer.from("IEND"), start);
    if (iend < 0) break;
    const chunk = buf.subarray(start, iend + 8);
    if (chunk.length > 4000) out.push(Buffer.from(chunk));
    i = iend + 8;
  }
  // Largest first (usually the full page scan)
  return out.sort((a, b) => b.length - a.length);
}

function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Ensure a data URL suitable for vision image_url (never application/pdf). */
export function toVisionImageDataUrl(input: string | Buffer): string {
  if (typeof input === "string" && input.startsWith("data:")) {
    const parsed = parseDataUrl(input);
    if (!parsed) throw new Error("Invalid data URL");
    if (parsed.mime.startsWith("image/")) {
      // already an image
      return input;
    }
    if (
      parsed.mime.includes("pdf") ||
      parsed.buf.subarray(0, 4).toString("ascii") === "%PDF"
    ) {
      const images = extractEmbeddedImages(parsed.buf);
      if (!images.length) {
        throw new Error(
          "Could not read pages from this PDF. Please upload a JPG or PNG photo instead.",
        );
      }
      const img = images[0]!;
      const mime = sniffImageMime(img) ?? "image/jpeg";
      return `data:${mime};base64,${img.toString("base64")}`;
    }
    // unknown — try sniff
    const mime = sniffImageMime(parsed.buf);
    if (mime) return `data:${mime};base64,${parsed.buf.toString("base64")}`;
    throw new Error("Unsupported file format for document verification.");
  }

  const buf = typeof input === "string" ? Buffer.from(input) : input;
  if (buf.subarray(0, 4).toString("ascii") === "%PDF") {
    const images = extractEmbeddedImages(buf);
    if (!images.length) {
      throw new Error(
        "Could not read pages from this PDF. Please upload a JPG or PNG photo instead.",
      );
    }
    const img = images[0]!;
    const mime = sniffImageMime(img) ?? "image/jpeg";
    return `data:${mime};base64,${img.toString("base64")}`;
  }
  const mime = sniffImageMime(buf);
  if (mime) return `data:${mime};base64,${buf.toString("base64")}`;
  throw new Error("Unsupported file format for document verification.");
}
