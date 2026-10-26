export type ChatIntent =
  | "billing"
  | "balance"
  | "purchase"
  | "sim"
  | "faq"
  | "handoff"
  | "coverage"
  | "unknown";

const PATTERNS: Array<{ intent: ChatIntent; re: RegExp }> = [
  {
    intent: "handoff",
    re: /\b(human|agent|person|call centre|call center|speak to|talk to (an )?agent|talk to someone|representative|real person)\b/i,
  },
  {
    intent: "coverage",
    re: /\b(check( my)? coverage|coverage\b|5g at (my )?(home|address|place)|fibre available|fiber available|is fibre|is fiber|internet options at (my )?(location|address)|check 5g|check fibre|check fiber|can i get 5g|do (we|you) have (5g|4g|lte|fibre|fiber|coverage)|is there (5g|4g|lte|coverage|fibre|fiber|signal)|(5g|4g|lte|fibre|fiber|signal|coverage)\s+(available\s+)?(in|at|near|here)\b)/i,
  },
  {
    intent: "sim",
    re: /\b(sim\s*swap|lost (my )?sim|stolen|block (my )?sim|unblock|puk|lost (my )?phone|replace (my )?sim|suspend (my )?sim|sim self[- ]?care)\b/i,
  },
  {
    intent: "purchase",
    re: /\b(buy|purchase|top\s*up|data bundle|whatsapp bundle|tiktok bundle|airtime|package|upgrade|lte\s*120|120\s*gb)\b/i,
  },
  {
    intent: "balance",
    re: /\b(balance|how much data|remaining|usage|my plan|data left)\b/i,
  },
  {
    intent: "billing",
    re: /\b(bill|invoice|statement|payment due|arrears|explain (my )?bill|understand (my )?bill|charges)\b/i,
  },
];

export function detectIntent(text: string): ChatIntent {
  for (const p of PATTERNS) {
    if (p.re.test(text)) return p.intent;
  }
  return "faq";
}

/** Pull a place phrase out of a coverage question, e.g. "coverage at Sandton City" → "sandton city". */
export function extractCoveragePlace(text: string): string | null {
  const m = text.match(
    /(?:coverage|5g|4g|lte|fibre|fiber|internet)\s+(?:available\s+|availability\s+)?(?:at|in|for|near)\s+(.+?)\s*[?.!]*$/i,
  );
  return m ? m[1].trim() : null;
}

/**
 * Device-geolocation intent, e.g. "use my current location", "no, use my
 * location", "share my location", "where i am". Used in the coverage flow to
 * route typed requests to the browser geolocation path instead of treating
 * them as an address query.
 */
export function isDeviceLocationRequest(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (/\bwhere i am\b/.test(t)) return true;
  if (!/\b(location|position|gps|here)\b/.test(t)) return false;
  return /\b(use|share|my|current|device|phone|detect|here|this)\b/.test(t);
}
