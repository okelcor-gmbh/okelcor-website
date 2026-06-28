"use client";

/**
 * Leaflet delivery map (customer). Shows the vehicle's current position and its
 * recent trail polyline. Client-only — import via next/dynamic({ ssr: false }).
 */

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Position } from "@/lib/tracking";
import { formatSpeed, lastSeen } from "@/lib/tracking";

function Recenter({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 13);
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export default function DeliveryMap({
  position,
  route = [],
  name,
}: {
  position: Position;
  route?: { latitude: number; longitude: number }[];
  name?: string | null;
}) {
  const line = useMemo<[number, number][]>(
    () => route.map((p) => [p.latitude, p.longitude]),
    [route]
  );
  const here: [number, number] = [position.latitude, position.longitude];
  const fitPoints = line.length > 1 ? line : [here];

  return (
    <MapContainer center={here} zoom={12} scrollWheelZoom className="h-full w-full" style={{ minHeight: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter points={fitPoints} />

      {line.length > 1 && (
        <Polyline positions={line} pathOptions={{ color: "#f4511e", weight: 3, opacity: 0.75 }} />
      )}

      <CircleMarker
        center={here}
        radius={9}
        pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#f4511e", fillOpacity: 1 }}
      >
        <Popup>
          <div className="text-[13px]">
            {name && <p className="font-bold">{name}</p>}
            <p>Speed: {formatSpeed(position.speed_kmh)}</p>
            {position.address && <p>{position.address}</p>}
            <p className="text-gray-500">Updated {lastSeen(position.fix_time)}</p>
          </div>
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}
