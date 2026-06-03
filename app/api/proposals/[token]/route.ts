/**
 * CRM-7: Public proposal info fetch (no auth required).
 * GET → GET /proposals/{token}
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const res = await fetch(
      `${API_URL}/proposals/${encodeURIComponent(token)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
