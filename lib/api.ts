/**
 * lib/api.ts
 *
 * Base API client for the Okelcor Laravel backend.
 *
 * Usage (server component with ISR):
 *   const { data } = await apiFetch<HeroSlide[]>('/hero-slides', { locale: 'en', revalidate: 60 });
 *
 * Usage (server action / route handler — no cache):
 *   const { data } = await apiFetch<QuoteResponse>('/quote-requests', { method: 'POST', body: payload });
 */

// ── Environment ───────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Shared response envelope ──────────────────────────────────────────────────

export type ApiResponse<T> = {
  data: T;
  meta: Record<string, unknown>;
  message: string;
};

// ── Domain types ──────────────────────────────────────────────────────────────

export type HeroSlide = {
  id: number;
  label?: string;
  title: string;
  subtitle: string;
  media_type: "image" | "video";
  image_url: string | null;
  video_url: string | null;
  /** Optional per-slide CTA overrides; fall back to global i18n labels when absent */
  cta_primary_label?: string;
  cta_primary_href?: string;
  cta_secondary_label?: string;
  cta_secondary_href?: string;
  order?: number;
};

export type Category = {
  id: number;
  /** Fixed slugs: pcr | tbr | used | otr */
  slug: string;
  label: string;
  title: string;
  subtitle: string;
  image_url: string;
  order?: number;
};

export type Brand = {
  id: number;
  name: string;
  /** Absolute URL from API storage (e.g. http://localhost:8000/storage/brands/michelin.png) */
  logo_url: string;
};

/**
 * Product as returned by the Laravel API.
 * `image_url` is the primary image; `images` is the gallery array.
 * Use normalizeApiProduct() to convert this to the local Product shape.
 */
export type ApiProduct = {
  id: number;
  brand: string;
  name: string;
  size: string;
  spec: string;
  season: string;
  type: string;
  price: number;
  price_b2b?: number | null;
  price_b2c?: number | null;
  /** Primary cover image — detail endpoint returns this as primary_image */
  primary_image?: string | null;
  /** List endpoint may return image_url; use primary_image ?? image_url in normalizers */
  image_url?: string | null;
  /** Some endpoints return the cover as bare `image` */
  image?: string | null;
  /** Gallery — may be string paths or objects with a `path` field */
  images: (string | { path?: string; url?: string; image_url?: string })[];
  /** Brand-level fallback image path — backend sets this when primary_image is absent.
   *  Returned as a storage path (e.g. storage/brands/rapid.jpg) or absolute URL. */
  brand_image?: string | null;
  sku: string;
  description: string;
  in_stock?: boolean;
};

/**
 * Article as returned by the Laravel public API (locale already resolved server-side).
 * Field names vary by endpoint — normalise everything in toArticle().
 */
export type ApiArticle = {
  id: number;
  slug: string;
  /** Primary image — may come back as image or image_url depending on endpoint */
  image?: string | null;
  image_url?: string | null;
  category?: string;
  title?: string;
  /** Date may be returned as published_at or date */
  published_at?: string | null;
  date?: string | null;
  read_time?: string | null;
  summary?: string | null;
  /** Body paragraphs — may be null if translations aren't resolved */
  body?: string[] | null;
};

/** Raw product entry from GET /api/v1/search */
export type SearchApiProduct = {
  id: number;
  brand: string;
  name: string;
  size?: string;
  type?: string;
  price: number;
  image_url?: string;
  image?: string;
};

/** Raw article entry from GET /api/v1/search */
export type SearchApiArticle = {
  slug: string;
  title: string;
  category?: string;
  date?: string;
  image_url?: string;
  image?: string;
};

/** Top-level `data` shape returned by GET /api/v1/search */
export type SearchApiData = {
  products: SearchApiProduct[];
  articles: SearchApiArticle[];
};

// ── apiFetch ──────────────────────────────────────────────────────────────────

export type ApiFetchOptions = {
  /** BCP-47 locale code forwarded as ?locale= query param */
  locale?: string;
  /** Arbitrary extra query params appended to the URL */
  params?: Record<string, string>;
  /**
   * Next.js ISR revalidation in seconds.
   * Pass `false` to opt into `no-store` (always fresh).
   * Omit to use Next.js default (force-cache in production).
   */
  revalidate?: number | false;
  /** Next.js on-demand revalidation tags */
  tags?: string[];
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Bearer token — used when the endpoint requires customer authentication */
  token?: string;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { locale, params, revalidate, tags, method = "GET", body, token } = options;

  // Build URL — always relative to the configured base
  const url = new URL(`${BASE_URL}${path}`);
  if (locale) url.searchParams.set("locale", locale);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  // Build Next.js fetch cache options.
  // revalidate: false  → cache: 'no-store' (always fresh — must be top-level, NOT inside next:{})
  // revalidate: number → next: { revalidate: n }  (ISR)
  // revalidate: omitted → Next.js default (force-cache in production)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextCacheOptions: Record<string, any> = {};
  if (typeof revalidate === "number") nextCacheOptions.revalidate = revalidate;
  if (tags?.length) nextCacheOptions.tags = tags;

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    // no-store must be a top-level cache option — next: { revalidate: false } means
    // "cache forever", which is the opposite of what we want.
    ...(revalidate === false
      ? { cache: "no-store" as const }
      : Object.keys(nextCacheOptions).length
      ? { next: nextCacheOptions }
      : {}),
  });

  if (!res.ok) {
    throw new Error(
      `[apiFetch] ${method} ${path} → HTTP ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<ApiResponse<T>>;
}
