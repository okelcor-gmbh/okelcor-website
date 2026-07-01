/**
 * GET  /api/admin/media   — paginated media library list
 * POST /api/admin/media   — upload new file (multipart: file, collection?, alt_text?)
 *
 * Proxies to:
 *   GET  /admin/media?collection=&search=&per_page=
 *   POST /admin/media
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

async function getToken() {
  const store = await cookies();
  return store.get("admin_token")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const tk = await getToken();
  if (!tk) return NextResponse.json({ data: [], meta: {} }, { status: 200 });

  const incoming = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  for (const key of ["collection", "search", "per_page", "page"] as const) {
    const v = incoming.get(key);
    if (v) qs.set(key, v);
  }

  try {
    const res = await fetch(`${BASE}/media?${qs.toString()}`, {
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

  const contentType = req.headers.get("content-type") ?? "";
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum upload size is 50 MB." }, { status: 413 });
  }

  try {
    const res = await fetch(`${BASE}/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tk}`,
        Accept: "application/json",
        "content-type": contentType,
      },
      body: req.body,
      // @ts-ignore — Node 18+ requires duplex when body is a ReadableStream
      duplex: "half",
    });
    if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });
    const json = await res.json().catch(() => ({ error: "Unreadable response." }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }
}
