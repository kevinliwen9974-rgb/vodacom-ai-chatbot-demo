"use client";

import { useMemo } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CoverageLocation } from "@/lib/coverage/types";

type Props = {
  location: CoverageLocation;
  draggable?: boolean;
  onRelocate?: (lat: number, lng: number) => void;
};

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#0a97ff;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,46,77,.45),0 0 0 6px rgba(10,151,255,.25);cursor:grab"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function LeafletMap({ location, draggable, onRelocate }: Props) {
  const center: [number, number] = [location.lat, location.lng];
  const handlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        const m = e.target as L.Marker;
        const p = m.getLatLng();
        onRelocate?.(p.lat, p.lng);
      },
    }),
    [onRelocate],
  );

  return (
    <MapContainer
      key={`${location.lat},${location.lng}`}
      center={center}
      zoom={16}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker
        position={center}
        icon={pinIcon}
        draggable={Boolean(draggable)}
        eventHandlers={handlers}
      />
    </MapContainer>
  );
}
