export type VodacomStore = {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
};

/** Demo store catalogue with approximate coordinates (SA metros). */
export const SIM_STORES: VodacomStore[] = [
  {
    id: "store-sandton",
    name: "Vodacom Sandton City",
    address: "Sandton City Mall, Johannesburg",
    city: "Johannesburg",
    lat: -26.1086,
    lng: 28.0517,
  },
  {
    id: "store-rosebank",
    name: "Vodacom The Zone @ Rosebank",
    address: "The Zone, Oxford Rd, Rosebank",
    city: "Johannesburg",
    lat: -26.1456,
    lng: 28.0416,
  },
  {
    id: "store-moa",
    name: "Vodacom Mall of Africa",
    address: "Mall of Africa, Waterfall City, Midrand",
    city: "Johannesburg",
    lat: -26.0145,
    lng: 28.1056,
  },
  {
    id: "store-fourways",
    name: "Vodacom Fourways Mall",
    address: "Fourways Mall, Johannesburg",
    city: "Johannesburg",
    lat: -26.0209,
    lng: 28.0074,
  },
  {
    id: "store-cedar",
    name: "Vodacom Cedar Square",
    address: "Cedar Square Shopping Centre, Fourways",
    city: "Johannesburg",
    lat: -26.0278,
    lng: 27.9985,
  },
  {
    id: "store-greenstone",
    name: "Vodacom Greenstone",
    address: "Greenstone Shopping Centre, Modderfontein",
    city: "Johannesburg",
    lat: -26.1225,
    lng: 28.1482,
  },
  {
    id: "store-melrose",
    name: "Vodacom Melrose Arch",
    address: "Melrose Arch, Johannesburg",
    city: "Johannesburg",
    lat: -26.1332,
    lng: 28.0684,
  },
  {
    id: "store-eastgate",
    name: "Vodacom Eastgate",
    address: "Eastgate Shopping Centre, Bedfordview",
    city: "Johannesburg",
    lat: -26.1808,
    lng: 28.1164,
  },
  {
    id: "store-centurion",
    name: "Vodacom Centurion Mall",
    address: "Centurion Mall, Centurion",
    city: "Pretoria",
    lat: -25.8603,
    lng: 28.1894,
  },
  {
    id: "store-canal",
    name: "Vodacom Canal Walk",
    address: "Canal Walk Shopping Centre, Cape Town",
    city: "Cape Town",
    lat: -33.8925,
    lng: 18.5112,
  },
  {
    id: "store-vna",
    name: "Vodacom V&A Waterfront",
    address: "V&A Waterfront, Cape Town",
    city: "Cape Town",
    lat: -33.9036,
    lng: 18.4204,
  },
  {
    id: "store-gateway",
    name: "Vodacom Gateway",
    address: "Gateway Theatre of Shopping, Durban",
    city: "Durban",
    lat: -29.7265,
    lng: 31.0654,
  },
  {
    id: "store-menlyn",
    name: "Vodacom Menlyn Maine",
    address: "Menlyn Maine Central Square, Pretoria",
    city: "Pretoria",
    lat: -25.7865,
    lng: 28.2773,
  },
];

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function rankStoresByLocation(lat: number, lng: number, limit = 4) {
  return [...SIM_STORES]
    .map((s) => ({
      ...s,
      distanceKm: Math.round(haversineKm({ lat, lng }, s) * 10) / 10,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function rankStoresByQuery(query: string, limit = 4) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return SIM_STORES.slice(0, limit).map((s) => ({ ...s, distanceKm: undefined as number | undefined }));
  }
  const scored = SIM_STORES.map((s) => {
    const hay = `${s.name} ${s.address} ${s.city}`.toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 10;
    for (const token of q.split(/\s+/)) {
      if (token.length > 2 && hay.includes(token)) score += 3;
    }
    return { ...s, score, distanceKm: undefined as number | undefined };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) {
    return SIM_STORES.slice(0, limit).map((s) => ({
      ...s,
      distanceKm: undefined as number | undefined,
    }));
  }
  return scored.slice(0, limit);
}
