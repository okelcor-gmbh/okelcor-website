/**
 * GET  /api/admin/bulk-emails          — campaign history
 * POST /api/admin/bulk-emails          — create + queue campaign
 *
 * Proxies to:
 *   GET  /admin/bulk-emails?per_page=
 *   POST /admin/bulk-emails   body: { subject, body_html, filters? }
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

async function getToken() {
  const store = await cookies();
  return store.get("admin_token")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const tk = await getToken();
  if (!tk) return NextResponse.json({ data: [], meta: {} }, { status: 200 });

  const perPage = req.nextUrl.searchParams.get("per_page") ?? "20";
  const page    = req.nextUrl.searchParams.get("page") ?? "1";

  try {
    const res = await fetch(`${BASE}/bulk-emails?per_page=${perPage}&page=${page}`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ data: [], meta: {} }, { status: 200 });
    const json = await res.json().catch(() => ({ data: [], meta: {} }));
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json({ data: [], meta: {} }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const tk = await getToken();
  if (!tk) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/bulk-emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tk}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });

    const json = await res.json().catch(() => ({ error: "Unreadable response." }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }
}
