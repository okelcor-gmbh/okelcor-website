"use client";

/**
 * Leaflet location picker (admin). Click the map to drop / move a destination pin.
 * Client-only — import via next/dynamic({ ssr: false }).
 */

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const FALLBACK_CENTER: [number, number] = [48.137, 11.575]; // Munich (HQ)

function ClickCapture({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Recenter only when the pin lands off-screen (prefill / pasted coords) so normal
// in-view clicks don't make the map jump.
function Recenter({ value }: { value: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (value && !map.getBounds().contains(value)) {
      map.setView(value, Math.max(map.getZoom(), 12));
    }
  }, [map, value]);
  return null;
}

export default function LocationPickerMap({
  value,
  onPick,
}: {
  value: { lat: number; lon: number } | null;
  onPick: (lat: number, lon: number) => void;
}) {
  const point: [number, number] | null = value ? [value.lat, value.lon] : null;

  return (
    <MapContainer
      center={point ?? FALLBACK_CENTER}
      zoom={point ? 12 : 5}
      scrollWheelZoom
      className="h-full w-full"
      style={{ minHeight: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onPick={onPick} />
      <Recenter value={point} />
      {point && (
        <CircleMarker
          center={point}
          radius={9}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#f4511e", fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  );
}
