import type { CoverageCheckResponse } from "@/lib/coverage/types";

export function coverageResultCopy(result: CoverageCheckResponse): string {
  if (result.status === "COMPLEX" || result.requiresOfficialCheck) {
    return "I can handle the basic coverage check here. For detailed availability, I'll take you to Vodacom's official coverage checker.";
  }
  const c = result.coverage;
  if (!c) {
    return "Great news. Several Vodacom connectivity options are available at your location.";
  }
  const five = c["5g"];
  const lte = c.lte || c["4g"];
  const fibre = c.fibre;
  if (five && lte && fibre) {
    return "Good news. Vodacom 5G, LTE and Fibre are available at this location.";
  }
  if (!five && (lte || fibre)) {
    return "5G isn't currently available at this location, but you can still choose from LTE and Fibre options.";
  }
  return "Great news. Several Vodacom connectivity options are available at your location.";
}

export function coverageNextStepCopy(): string {
  return "Based on your location, you can explore Vodacom home internet options.";
}
