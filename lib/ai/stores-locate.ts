import {
  rankStoresByLocation,
  rankStoresByQuery,
  type VodacomStore,
} from "@/lib/sim/stores";

export type RankedStore = VodacomStore & { distanceKm?: number };

async function geocodeNominatim(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", `${q}, South Africa`);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "VodacomDemo-StoreLocator/1.0 (demo; contact: local)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const row = rows[0];
    if (!row?.lat || !row?.lon) return null;
    return { lat: Number(row.lat), lng: Number(row.lon) };
  } catch {
    return null;
  }
}

/**
 * Locate nearest Vodacom stores from catalogue.
 * Demo currently skips Dify — local Haversine + Nominatim only.
 */
export async function locateStores(input: {
  query?: string;
  lat?: number;
  lng?: number;
  limit?: number;
}): Promise<{ stores: RankedStore[]; source: "local" | "nominatim" }> {
  const limit = input.limit ?? 4;

  if (
    typeof input.lat === "number" &&
    typeof input.lng === "number" &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lng)
  ) {
    return {
      stores: rankStoresByLocation(input.lat, input.lng, limit),
      source: "local",
    };
  }

  if (input.query?.trim()) {
    const geo = await geocodeNominatim(input.query);
    if (geo) {
      return {
        stores: rankStoresByLocation(geo.lat, geo.lng, limit),
        source: "nominatim",
      };
    }
  }

  return {
    stores: rankStoresByQuery(input.query ?? "", limit),
    source: "local",
  };
}
