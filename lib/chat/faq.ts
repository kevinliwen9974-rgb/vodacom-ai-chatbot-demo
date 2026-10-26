import { readFileSync } from "fs";
import { join } from "path";

export type FaqEntry = { question: string; answer: string; source?: string };

let cached: FaqEntry[] | null = null;

function loadFaq(): FaqEntry[] {
  if (cached) return cached;
  const path = join(process.cwd(), "data/faq/faq.txt");
  let raw = "";
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    cached = [];
    return cached;
  }
  const entries: FaqEntry[] = [];
  const blocks = raw.split(/\n(?=Question\d+:)/i);
  for (const block of blocks) {
    const qm = block.match(/Question\d+:\s*([\s\S]*?)(?=\nAnswer\d+:)/i);
    const am = block.match(/Answer\d+:\s*([\s\S]*?)(?=\nSource\d+:|$)/i);
    const sm = block.match(/Source\d+:\s*(\S+)/i);
    if (qm && am) {
      entries.push({
        question: qm[1].trim(),
        answer: am[1].trim(),
        source: sm?.[1],
      });
    }
  }
  cached = entries;
  return entries;
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

/** Lightweight FAQ retrieval (colleague chatbot-demo style, TypeScript). */
export function answerFromFaq(query: string): string | null {
  const entries = loadFaq();
  if (!entries.length) return null;
  const qTokens = tokenize(query);
  if (!qTokens.size) return null;

  let best: FaqEntry | null = null;
  let bestScore = 0;
  for (const entry of entries) {
    const t = tokenize(entry.question);
    let overlap = 0;
    for (const tok of qTokens) if (t.has(tok)) overlap += 1;
    const score = overlap / Math.sqrt(t.size || 1);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (!best || bestScore < 0.35) return null;
  return best.source ? `${best.answer}\n\nSource: ${best.source}` : best.answer;
}
