import {
  coverageScenarios,
  type CoverageScenario,
} from "@/mock/coverage";
import type { CoverageLocation, CoverageScenarioId } from "@/lib/coverage/types";

function norm(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseFreeform(query: string): CoverageLocation {
  const parts = query
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const line1 = parts[0] || query.trim() || "Entered address";
  const suburb = parts[1] || "Johannesburg";
  const city = parts[2] || (parts[1] ? "Johannesburg" : "South Africa");
  return {
    line1,
    suburb,
    city,
    formatted: parts.length >= 2 ? parts.join(", ") : `${line1}, ${suburb}, ${city}`,
    lat: -26.2041,
    lng: 28.0473,
    scenarioId: "complex",
  };
}

export function matchKnownCoverageLocation(query: string): CoverageLocation | null {
  const n = norm(query);
  if (!n) return null;
  const ranked = (Object.values(coverageScenarios) as CoverageScenario[]).find(
    (s) => s.keywords.some((k) => n.includes(norm(k))),
  );
  if (ranked) return ranked.location;
  if (/\b(oxford|rosebank)\b/.test(n)) return coverageScenarios.full.location;
  if (/\b(sandton|rivonia)\b/.test(n)) return coverageScenarios.partial.location;
  return null;
}

export function resolveCoverageLocation(query: string): CoverageLocation {
  const n = norm(query);
  if (!n) return coverageScenarios.full.location;

  const ranked = (Object.values(coverageScenarios) as CoverageScenario[]).find(
    (s) => s.keywords.some((k) => n.includes(norm(k))),
  );
  if (ranked) return ranked.location;

  if (/\b(oxford|rosebank)\b/.test(n)) return coverageScenarios.full.location;
  if (/\b(sandton|rivonia)\b/.test(n)) return coverageScenarios.partial.location;
  return parseFreeform(query);
}

export function resolveCoverageByCoords(
  lat: number,
  lng: number,
): CoverageLocation {
  let best: CoverageScenario | null = null;
  let bestDist = Infinity;
  for (const s of Object.values(coverageScenarios) as CoverageScenario[]) {
    const dlat = s.location.lat - lat;
    const dlng = s.location.lng - lng;
    const dist = dlat * dlat + dlng * dlng;
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  // Snap radius ~25 km (dist² in degrees) — covers a metro area, so a real
  // device location in Pretoria/Centurion or Joburg resolves to the demo
  // address there; far-away pins still fall through to "Pinned location".
  if (best && bestDist < 0.005) return best.location;
  return {
    line1: "Pinned location",
    suburb: "South Africa",
    city: "South Africa",
    formatted: "Pinned location, South Africa",
    lat,
    lng,
    scenarioId: "complex",
  };
}

export function scenarioForLocation(
  location: CoverageLocation,
): CoverageScenarioId {
  return location.scenarioId;
}
