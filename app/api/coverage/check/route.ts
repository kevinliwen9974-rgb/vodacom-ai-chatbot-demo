import { NextRequest, NextResponse } from "next/server";
import { coverageScenarios } from "@/mock/coverage";
import {
  resolveCoverageByCoords,
  resolveCoverageLocation,
} from "@/lib/coverage/resolve";
import { checkLiveCoverage } from "@/lib/coverage/live";
import type { CoverageCheckResponse } from "@/lib/coverage/types";

export const runtime = "nodejs";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toResponse(location: ReturnType<typeof resolveCoverageLocation>): CoverageCheckResponse {
  const scenario = coverageScenarios[location.scenarioId];
  if (scenario.status === "COMPLEX" || scenario.requiresOfficialCheck) {
    return {
      address: location.formatted,
      status: "COMPLEX",
      requiresOfficialCheck: true,
    };
  }
  const flags = scenario.coverage!;
  return {
    address: location.formatted,
    status: "AVAILABLE",
    coverage: {
      "5g": flags.fiveG,
      "4g": flags.fourG,
      lte: flags.lte,
      fibre: flags.fibre,
    },
  };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  if (url.searchParams.get("fail") === "1") {
    await sleep(350);
    return NextResponse.json(
      { error: "Coverage check unavailable" },
      { status: 502 },
    );
  }

  const latRaw = url.searchParams.get("lat");
  const lngRaw = url.searchParams.get("lng");
  const address = url.searchParams.get("address") ?? "";
  const lat = latRaw != null ? Number(latRaw) : NaN;
  const lng = lngRaw != null ? Number(lngRaw) : NaN;

  const location =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? resolveCoverageByCoords(lat, lng)
      : resolveCoverageLocation(address);

  // Real flags from Vodacom's public GIS whenever we have SA coordinates;
  // the mock scenario table is the fallback (and still provides fibre).
  const live =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? await checkLiveCoverage(lat, lng)
      : null;

  await sleep(420);

  if (live) {
    const scenario = coverageScenarios[location.scenarioId];
    const fibre = scenario.coverage?.fibre ?? false;
    const mobile = live.fiveG || live.lte;
    const payload: CoverageCheckResponse = mobile
      ? {
          address: address.trim() || location.formatted,
          status: "AVAILABLE",
          source: "live",
          coverage: {
            "5g": live.fiveG,
            "4g": live.lte,
            lte: live.lte,
            fibre,
          },
        }
      : {
          address: address.trim() || location.formatted,
          status: "COMPLEX",
          requiresOfficialCheck: true,
          source: "live",
        };
    return NextResponse.json(payload);
  }

  const payload = toResponse(location);
  payload.source = "demo";
  if (address.trim()) payload.address = address.trim();
  return NextResponse.json(payload);
}
