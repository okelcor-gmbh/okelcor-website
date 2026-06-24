import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/i18n/detect
 *
 * First-visit locale auto-detection. Resolves the visitor's country (from CDN geo
 * headers) into a UI locale using the backend's authoritative country→locale map.
 *
 * Why a server-side proxy instead of the browser calling the Laravel API directly:
 *  - Geo headers (x-vercel-ip-country / cf-ipcountry) are only present on the edge
 *    request to *this* Next route. A browser → api.okelcor.de call would not carry
 *    them, which is exactly the failure mode the backend warned about.
 *  - The country→locale map is fetched once per hour (revalidate) and shared across
 *    all visitors, so there is no per-request backend round trip.
 *
 * Country list is never hardcoded here — it comes from GET /i18n/locales, so adding
 * a language later is a backend-only change.
 *
 * Returns: { country, locale, isDefault, supported, default }
 */

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

// Degradation fallback used only when the backend /i18n/locales route is not yet
// deployed: an empty country map means everyone falls through to the default, so
// no visitor is ever auto-switched to the wrong language.
const FALLBACK_SUPPORTED = ["en", "de", "fr", "es"];
const FALLBACK_DEFAULT = "en";

type LocalesPayload = {
  supported: string[];
  default: string;
  country_locale: Record<string, string>;
};

// Fetch the backend country→locale map. Cached server-side (1h) and shared across
// all requests — the per-visitor work is just a map lookup.
async function fetchLocaleMap(): Promise<LocalesPayload> {
  try {
    const res = await fetch(`${API_URL}/i18n/locales`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const payload = json?.data ?? json;

    return {
      supported: Array.isArray(payload?.supported)
        ? payload.supported
        : [...FALLBACK_SUPPORTED],
      default:
        typeof payload?.default === "string" ? payload.default : FALLBACK_DEFAULT,
      country_locale:
        payload?.country_locale && typeof payload.country_locale === "object"
          ? payload.country_locale
          : {},
    };
  } catch {
    // Backend route not live yet → default-only, no auto-switch.
    return {
      supported: [...FALLBACK_SUPPORTED],
      default: FALLBACK_DEFAULT,
      country_locale: {},
    };
  }
}

// Must read per-request geo headers — never cache the response itself.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const h = request.headers;
  const country =
    (
      request.nextUrl.searchParams.get("country") || // explicit override (dev/testing)
      h.get("x-vercel-ip-country") || // Vercel
      h.get("cf-ipcountry") || // Cloudflare
      ""
    )
      .toUpperCase()
      .trim() || null;

  const map = await fetchLocaleMap();

  // Unknown/anonymizing values (e.g. Cloudflare "XX"/"T1") simply won't be in the
  // map and fall through to the default — no special-casing needed.
  const mapped = country ? map.country_locale[country] : undefined;
  const locale =
    mapped && map.supported.includes(mapped) ? mapped : map.default;

  return NextResponse.json({
    country,
    locale,
    isDefault: locale === map.default,
    supported: map.supported,
    default: map.default,
  });
}
