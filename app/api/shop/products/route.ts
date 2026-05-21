import { NextRequest, NextResponse } from "next/server";
import { rateLimit, retryAfter, getClientIp, rateLimitResponse, warnRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`shop-products:${ip}`, 300, 15 * 60 * 1000)) {
    warnRateLimit("/api/shop/products", "GET", ip, request.headers.get("user-agent") ?? "");
    return rateLimitResponse(retryAfter(`shop-products:${ip}`));
  }

  const search = request.nextUrl.search;
  const upstream = `${API_URL}/products${search}`;

  // The Laravel /products endpoint requires auth — forward the customer token.
  // Fall back to a guest token (SHOP_GUEST_TOKEN env var) for unauthenticated visitors.
  const customerToken = request.cookies.get("customer_token")?.value;
  const guestToken    = process.env.SHOP_GUEST_TOKEN ?? "";
  const authToken     = customerToken || guestToken;

  try {
    const res = await fetch(upstream, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    const raw = await res.text();

    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        {
          data: [],
          meta: { total: 0 },
          _proxy_error: `Upstream returned HTTP ${res.status} with non-JSON body`,
        },
        { status: 502 }
      );
    }

    // Prevent edge/CDN caching — prices must always be read fresh from the API.
    const response = NextResponse.json(data, { status: res.status });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Upstream-Status", String(res.status));
    return response;
  } catch (err) {
    console.error("[api/shop/products] network error:", err);
    return NextResponse.json(
      {
        data: [],
        meta: { total: 0 },
        _proxy_error: "Could not reach the product catalogue API.",
      },
      { status: 502 }
    );
  }
}
