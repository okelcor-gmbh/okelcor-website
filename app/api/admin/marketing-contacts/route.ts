/**
 * GET  /api/admin/marketing-contacts   — paginated contact list
 * POST /api/admin/marketing-contacts   — import CSV/TXT (multipart file)
 *
 * Proxies to:
 *   GET  /admin/marketing-contacts?status=&company=&country=&search=&per_page=&page=
 *   POST /admin/marketing-contacts/import   (multipart file field: "file")
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // allow time for large CSV imports

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

async function getToken() {
  const store = await cookies();
  return store.get("admin_token")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const tk = await getToken();
  if (!tk) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const incoming = req.nextUrl.searchParams;
  const allowed = ["status", "company", "country", "search", "per_page", "page"] as const;
  const qs = new URLSearchParams();
  for (const key of allowed) {
    const v = incoming.get(key);
    if (v) qs.set(key, v);
  }

  try {
    const res = await fetch(`${BASE}/marketing-contacts?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });
      if (res.status === 404 || res.status === 405) {
        return NextResponse.json({ data: [], meta: { total: 0, current_page: 1, last_page: 1 } }, { status: 200 });
      }
      const json = await res.json().catch(() => ({}));
      return NextResponse.json(json, { status: res.status });
    }

    const json = await res.json().catch(() => ({ data: [], meta: {} }));
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0, current_page: 1, last_page: 1 } }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const tk = await getToken();
  if (!tk) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse the uploaded file." }, { status: 400 });
  }

  const rawFile = formData.get("file");
  if (!rawFile || !(rawFile instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum upload size is 10 MB." }, { status: 413 });
  }

  const outForm = new FormData();
  outForm.append("file", rawFile);

  try {
    const res = await fetch(`${BASE}/marketing-contacts/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tk}`,
        Accept: "application/json",
        // Do NOT set Content-Type — fetch sets multipart boundary automatically
      },
      body: outForm,
    });

    if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });

    const json = await res.json().catch(() => ({ error: "Unreadable response from server." }));

    // Normalise: backend may wrap in { data: {...}, message: "..." }
    const payload = json?.data && typeof json.data === "object"
      ? { ...json.data, message: json.message ?? json.data.message }
      : json;

    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }
}
