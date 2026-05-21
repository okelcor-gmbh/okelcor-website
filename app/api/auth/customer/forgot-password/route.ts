import { NextRequest, NextResponse } from "next/server";
import { rateLimit, retryAfter, getClientIp, rateLimitResponse, warnRateLimit } from "@/lib/rate-limit";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)) {
    warnRateLimit("/api/auth/customer/forgot-password", "POST", ip, request.headers.get("user-agent") ?? "");
    return rateLimitResponse(retryAfter(`forgot-password:${ip}`));
  }

  try {
    const body = await request.json();

    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
