import { NextRequest, NextResponse } from "next/server";
import { rateLimit, retryAfter, getClientIp, rateLimitResponse, warnRateLimit } from "@/lib/rate-limit";

// Public endpoint — no auth token required.
// Proxies to the Laravel tracking API so the backend URL stays server-side
// and both the admin UI and customer-facing pages can use /api/tracking/:container.

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ container: string }> },
) {
  const ip = getClientIp(req);
  if (!rateLimit(`tracking:${ip}`, 30, 60 * 60 * 1000)) {
    warnRateLimit("/api/tracking/[container]", "GET", ip, req.headers.get("user-agent") ?? "");
    return rateLimitResponse(retryAfter(`tracking:${ip}`));
  }

  const { container } = await params;

  if (!container?.trim()) {
    return NextResponse.json({ error: "Container number is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${API_URL}/tracking/${encodeURIComponent(container.trim())}`,
      { cache: "no-store" },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok || !json) {
      return NextResponse.json(
        { error: "No tracking data found for this container." },
        { status: res.ok ? 404 : res.status },
      );
    }

    return NextResponse.json(json);
  } catch {
    return NextResponse.json(
      { error: "Could not reach the tracking service." },
      { status: 503 },
    );
  }
}
