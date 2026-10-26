import sharp from "sharp";

/**
 * Downscale vision images to cut DashScope latency (max edge ~1280).
 */
export async function downscaleVisionDataUrl(
  dataUrl: string,
  maxEdge = 1280,
): Promise<string> {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(dataUrl);
  if (!m) return dataUrl;
  const mime = (m[1] || "application/octet-stream").toLowerCase();
  const isB64 = Boolean(m[2]);
  const payload = m[3] ?? "";
  const buf = isB64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  if (!mime.startsWith("image/") && buf.subarray(0, 4).toString("ascii") !== "%PDF") {
    // try as image bytes
  }

  try {
    const out = await sharp(buf)
      .rotate()
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return dataUrl;
  }
}

export const VISION_MAX_EDGE = 1280;
