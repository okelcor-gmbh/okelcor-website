import { NextRequest, NextResponse } from "next/server";
import { rateLimit, retryAfter, getClientIp, rateLimitResponse, warnRateLimit } from "@/lib/rate-limit";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

// ── IP geolocation (fire-and-forget, best-effort) ─────────────────────────────

async function getLocation(ip: string): Promise<string> {
  if (!ip || ip === "unknown" || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return "";
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return "";
    const geo = await res.json() as { city?: string; country?: string };
    if (geo.city && geo.country) return `${geo.city}, ${geo.country}`;
    if (geo.country) return geo.country;
    return "";
  } catch {
    return "";
  }
}

// ── Post-login activity recording (fire-and-forget) ───────────────────────────

async function recordLoginActivity(
  token: string,
  ip: string,
  userAgent: string,
  location: string,
) {
  try {
    await fetch(`${API_URL}/auth/record-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        last_login_at: new Date().toISOString(),
        last_login_ip: ip || null,
        last_login_location: location || null,
        user_agent: userAgent || null,
      }),
    });
  } catch (e) {
    // Non-critical — don't log noise if the backend hasn't implemented this yet
    void e;
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    warnRateLimit("/api/auth/customer/login", "POST", ip, request.headers.get("user-agent") ?? "");
    return rateLimitResponse(retryAfter(`login:${ip}`));
  }

  // Extract real client IP (works behind proxies / Vercel / Cloudflare)
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "";
  const userAgent = request.headers.get("user-agent") ?? "";

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  // Proxy to backend — forward IP/UA so the backend can also record them
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Forward client metadata so backend can record it natively if desired
        "X-Forwarded-For": clientIp,
        "X-User-Agent": userAgent,
      },
      body: JSON.stringify(body),
    });
  } catch (fetchError) {
    const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
    console.error("[login] Backend unreachable:", msg);
    return NextResponse.json(
      { message: "Unable to connect to authentication service. Please try again." },
      { status: 503 }
    );
  }

  // Parse backend response
  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    console.error("[login] Backend returned non-JSON response, status:", res.status);
    return NextResponse.json(
      { message: "Authentication service returned an unexpected response. Please try again." },
      { status: 502 }
    );
  }

  // Backend 5xx — don't expose internal error details to the client
  if (res.status >= 500) {
    console.error("[login] Backend returned", res.status, data);
    return NextResponse.json(
      { message: "Our authentication service is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }

  // Forward backend 4xx error responses directly to the client
  if (!res.ok) {
    const message =
      (data.message as string) ??
      (data.error as string) ??
      (Array.isArray(data.errors)
        ? (data.errors[0] as string)
        : typeof data.errors === "object"
          ? Object.values(data.errors as Record<string, string[]>)[0]?.[0]
          : undefined) ??
      "Login failed. Please check your credentials.";

    // Pass onboarding_status so the login page can show the correct blocked/pending screen
    return NextResponse.json({ ...data, message }, { status: res.status });
  }

  // Extract token and customer from any common backend response shape
  const token: string =
    (data.token as string) ??
    (data.access_token as string) ??
    ((data.data as Record<string, unknown>)?.token as string) ??
    ((data.data as Record<string, unknown>)?.access_token as string) ??
    "";

  const rawCustomer =
    data.user ??
    data.customer ??
    (data.data as Record<string, unknown>)?.user ??
    (data.data as Record<string, unknown>)?.customer ??
    null;

  if (!token) {
    console.error("[login] Backend login succeeded but no token in response. Keys:", Object.keys(data));
  }

  // Fire-and-forget: resolve geolocation then record login activity.
  // Done AFTER building the response so it never delays the login reply.
  if (token) {
    getLocation(clientIp).then((location) => {
      recordLoginActivity(token, clientIp, userAgent, location);
    });
  }

  const response = NextResponse.json({
    customer: rawCustomer,
    email_verified: (data.email_verified as boolean) ?? (rawCustomer as Record<string, unknown> | null)?.email_verified ?? true,
    must_reset: (data.must_reset as boolean) ?? false,
  });

  if (token) {
    response.cookies.set("customer_token", token, COOKIE_OPTS);
  }

  return response;
}
