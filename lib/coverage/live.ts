/**
 * Live coverage from Vodacom's public ArcGIS MapServer (the same services that
 * power telkom.co.za/check-coverage). Feature-count query against each
 * technology layer; any failure returns null so callers can fall back to
 * demo data.
 */

export type LiveCoverage = {
  fiveG: boolean;
  lte: boolean;
};

const GIS_BASE = "https://gis.telkom.co.za/arcgis/rest/services/tm";

// Only South Africa makes sense to query live.
function inSouthAfrica(lat: number, lng: number): boolean {
  return lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33;
}

async function queryLayer(
  service: string,
  lat: number,
  lng: number,
): Promise<boolean> {
  // Count features in a ~550m envelope around the point. The query endpoint
  // is ~5x faster than identify on the dense LTE layer, and coverage
  // polygons are large contiguous areas so a small envelope is a faithful
  // point-coverage check.
  const d = 0.005;
  const extent = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  const url =
    `${GIS_BASE}/${service}/MapServer/0/query` +
    `?geometry=${extent}&geometryType=esriGeometryEnvelope&inSR=4326` +
    `&spatialRel=esriSpatialRelIntersects&returnCountOnly=true&f=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`gis ${res.status}`);
  const data = (await res.json()) as { count?: number };
  if (typeof data.count !== "number") throw new Error("gis no count");
  return data.count > 0;
}

/** Real coverage flags, or null when the GIS is unreachable / out of SA. */
export async function checkLiveCoverage(
  lat: number,
  lng: number,
): Promise<LiveCoverage | null> {
  if (!Number.isFinite(lat) || !inSouthAfrica(lat, lng)) return null;
  try {
    const [fiveG, lte] = await Promise.all([
      queryLayer("TM_5G", lat, lng),
      queryLayer("TM_LTE", lat, lng),
    ]);
    return { fiveG, lte };
  } catch {
    return null;
  }
}
