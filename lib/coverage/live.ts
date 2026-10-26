/**
 * No public Vodacom coverage API is used by this demo. Returning null keeps the
 * existing deterministic demo result and directs customers to the official map.
 */

export type LiveCoverage = {
  fiveG: boolean;
  lte: boolean;
};

// Only South Africa makes sense to query live.
function inSouthAfrica(lat: number, lng: number): boolean {
  return lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33;
}

/** Real coverage flags, or null when the GIS is unreachable / out of SA. */
export async function checkLiveCoverage(
  lat: number,
  lng: number,
): Promise<LiveCoverage | null> {
  if (!Number.isFinite(lat) || !inSouthAfrica(lat, lng)) return null;
  return null;
}
