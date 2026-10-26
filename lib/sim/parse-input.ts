/**
 * Lightweight parsers for SIM chat free-text → widget prefill.
 */

export function parseMsisdn(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(0, 10);
  if (digits.length === 9 && digits.startsWith("8")) return `0${digits}`;
  return null;
}

export function parseDateYmd(text: string): string | null {
  const t = text.trim();
  const iso = t.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const slash = t.match(/\b(\d{1,2})[\/.](\d{1,2})[\/.](20\d{2})\b/);
  if (slash) {
    const d = slash[1]!.padStart(2, "0");
    const m = slash[2]!.padStart(2, "0");
    return `${slash[3]}-${m}-${d}`;
  }
  const long = t.match(
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(20\d{2})\b/i,
  );
  if (long) {
    const months: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };
    const m = months[long[2]!.slice(0, 3).toLowerCase()];
    if (m) return `${long[3]}-${m}-${long[1]!.padStart(2, "0")}`;
  }
  return null;
}

export function parseAmount(text: string): string | null {
  const m = text.replace(/,/g, "").match(/(?:R\s*)?(\d+(?:\.\d{1,2})?)/i);
  if (!m) return null;
  return m[1]!;
}

export function parsePhone(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 9 && digits.length <= 12) return digits;
  return null;
}
