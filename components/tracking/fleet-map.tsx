"use client";

/**
 * Leaflet fleet map (admin). Renders device markers coloured by status, the
 * selected device's route polyline, and geofences parsed from WKT. Client-only —
 * import via next/dynamic({ ssr: false }) because Leaflet needs `window`.
 */

import { useEffect, useMemo } from "react";
import {
  MapContainer, TileLayer, CircleMarker, Polyline, Circle, Polygon, Popup, Tooltip, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Device, Geofence, Position } from "@/lib/tracking";
import { statusStyle, parseWkt, formatSpeed, lastSeen } from "@/lib/tracking";

const FALLBACK_CENTER: [number, number] = [48.137, 11.575]; // Munich (HQ)

// Fit the map to all relevant points whenever they change.
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, points]);
  return null;
}

export default function FleetMap({
  devices,
  geofences = [],
  routePoints = [],
  selectedDeviceId = null,
  onSelectDevice,
}: {
  devices: Device[];
  geofences?: Geofence[];
  routePoints?: Position[];
  selectedDeviceId?: number | null;
  onSelectDevice?: (id: number) => void;
}) {
  const located = devices.filter((d) => d.position);

  const fitPoints = useMemo<[number, number][]>(() => {
    if (routePoints.length > 0) {
      return routePoints.map((p) => [p.latitude, p.longitude]);
    }
    return located.map((d) => [d.position!.latitude, d.position!.longitude]);
  }, [located, routePoints]);

  const routeLine = useMemo<[number, number][]>(
    () => routePoints.map((p) => [p.latitude, p.longitude]),
    [routePoints]
  );

  return (
    <MapContainer
      center={fitPoints[0] ?? FALLBACK_CENTER}
      zoom={fitPoints.length ? 11 : 5}
      scrollWheelZoom
      className="h-full w-full"
      style={{ minHeight: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds points={fitPoints} />

      {/* Geofences */}
      {geofences.map((g) => {
        const parsed = parseWkt(g.area);
        if (!parsed) return null;
        const opts = { color: "#f4511e", weight: 1.5, fillColor: "#f4511e", fillOpacity: 0.06 };
        if (parsed.type === "circle") {
          return (
            <Circle key={g.id} center={parsed.center} radius={parsed.radius} pathOptions={opts}>
              <Tooltip>{g.name}</Tooltip>
            </Circle>
          );
        }
        return (
          <Polygon key={g.id} positions={parsed.points} pathOptions={opts}>
            <Tooltip>{g.name}</Tooltip>
          </Polygon>
        );
      })}

      {/* Selected device route */}
      {routeLine.length > 1 && (
        <Polyline positions={routeLine} pathOptions={{ color: "#2563eb", weight: 3, opacity: 0.8 }} />
      )}

      {/* Device markers */}
      {located.map((d) => {
        const pos = d.position!;
        const s = statusStyle(d.status);
        const isSelected = d.id === selectedDeviceId;
        return (
          <CircleMarker
            key={d.id}
            center={[pos.latitude, pos.longitude]}
            radius={isSelected ? 11 : 8}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: s.color,
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelectDevice?.(d.id) }}
          >
            <Popup>
              <div className="text-[13px]">
                <p className="font-bold">{d.name}</p>
                <p>Status: {s.label}</p>
                <p>Speed: {formatSpeed(pos.speed_kmh)}</p>
                {pos.address && <p>{pos.address}</p>}
                <p className="text-gray-500">Updated {lastSeen(pos.fix_time ?? d.last_update)}</p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
