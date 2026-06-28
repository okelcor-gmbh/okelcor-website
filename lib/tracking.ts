/**
 * GPS / fleet tracking (Traccar-backed) — shared types + helpers.
 *
 * Contract: docs/FRONTEND_NOTE_tracking.md (backend). Speeds are already km/h and
 * distances already km (converted server-side). Geofence `area` is WKT.
 * All browser calls go through the Next.js proxy with the bearer.
 */

// ─── Model ──────────────────────────────────────────────────────────────────────

export type DeviceStatus = "online" | "offline" | "unknown";

export type Position = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed_kmh?: number | null;
  course?: number | null;
  address?: string | null;
  fix_time?: string | null;
  valid?: boolean | null;
};

export type Device = {
  id: number;
  name: string;
  unique_id?: string | null;
  status: DeviceStatus;
  disabled?: boolean;
  category?: string | null;
  last_update?: string | null;
  position: Position | null;
};

export type Trip = {
  start_time?: string | null;
  end_time?: string | null;
  start_address?: string | null;
  end_address?: string | null;
  start_lat?: number | null;
  start_lon?: number | null;
  end_lat?: number | null;
  end_lon?: number | null;
  distance_km?: number | null;
  avg_speed_kmh?: number | null;
  max_speed_kmh?: number | null;
  duration_ms?: number | null;
};

export type Geofence = {
  id: number;
  name: string;
  description?: string | null;
  area: string; // WKT
};

export type TrackingStatus = {
  configured: boolean;
  connected: boolean;
  server?: string | null;
  user?: string | null;
  message?: string | null;
};

/** Customer delivery-tracking payload (lean; always HTTP 200). */
export type CustomerTracking =
  | { available: false; reason?: "no_device" | "unavailable" | string }
  | {
      available: true;
      order_ref: string;
      name?: string | null;
      status?: DeviceStatus | null;
      last_update?: string | null;
      position: Position;
      route?: { latitude: number; longitude: number; fix_time?: string | null }[];
    };

// ─── Status → colour ──────────────────────────────────────────────────────────

type StatusStyle = { color: string; chip: string; dot: string; label: string };

const STATUS_STYLES: Record<DeviceStatus, StatusStyle> = {
  online:  { color: "#16a34a", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Online" },
  offline: { color: "#6b7280", chip: "bg-gray-100 text-gray-600 border-gray-200",        dot: "bg-gray-400",    label: "Offline" },
  unknown: { color: "#f59e0b", chip: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500",   label: "Unknown" },
};

export function statusStyle(status?: DeviceStatus | null): StatusStyle {
  return STATUS_STYLES[status ?? "unknown"] ?? STATUS_STYLES.unknown;
}

// ─── WKT geofence parser ──────────────────────────────────────────────────────
// Traccar emits `CIRCLE (lat lon, radius)` and `POLYGON ((lat lon, lat lon, …))`
// — note the lat-then-lon coordinate order. Returns Leaflet-ready [lat, lng].

export type ParsedGeofence =
  | { type: "circle"; center: [number, number]; radius: number }
  | { type: "polygon"; points: [number, number][] }
  | null;

export function parseWkt(wkt?: string | null): ParsedGeofence {
  if (!wkt) return null;
  const text = wkt.trim();

  const circle = /^CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i.exec(text);
  if (circle) {
    const lat = parseFloat(circle[1]);
    const lng = parseFloat(circle[2]);
    const radius = parseFloat(circle[3]);
    if ([lat, lng, radius].every(Number.isFinite)) {
      return { type: "circle", center: [lat, lng], radius };
    }
    return null;
  }

  const polygon = /^POLYGON\s*\(\((.+)\)\)/i.exec(text);
  if (polygon) {
    const points: [number, number][] = [];
    for (const pair of polygon[1].split(",")) {
      const [latStr, lngStr] = pair.trim().split(/\s+/);
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (Number.isFinite(lat) && Number.isFinite(lng)) points.push([lat, lng]);
    }
    return points.length >= 3 ? { type: "polygon", points } : null;
  }

  return null;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatSpeed(kmh?: number | null): string {
  if (kmh == null || !Number.isFinite(kmh)) return "—";
  return `${Math.round(kmh)} km/h`;
}

export function formatDistance(km?: number | null): string {
  if (km == null || !Number.isFinite(km)) return "—";
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function formatDuration(ms?: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "—";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** "x min/h ago" relative stamp for a fix/last-update time. */
export function lastSeen(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 30) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Centre + zoom for a set of points (Leaflet fitBounds is done in-map; this is a fallback centre). */
export function centroid(points: { latitude: number; longitude: number }[]): [number, number] | null {
  const valid = points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  if (valid.length === 0) return null;
  const lat = valid.reduce((s, p) => s + p.latitude, 0) / valid.length;
  const lng = valid.reduce((s, p) => s + p.longitude, 0) / valid.length;
  return [lat, lng];
}
