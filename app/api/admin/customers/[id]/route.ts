/**
 * /api/admin/customers/[id]
 * GET  → fetch customer detail (status, last_login, notes, etc.)
 * PATCH → update status or admin_notes
 * DELETE → delete customer account
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

async function token() {
  const s = await cookies();
  return s.get("admin_token")?.value ?? null;
}

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tk = await token();
  if (!tk) return unauth();
  const { id } = await params;

  try {
    // Try the individual detail endpoint first
    const res = await fetch(`${BASE}/customers/${id}`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      return NextResponse.json(json);
    }

    // Auth errors — forward immediately, no fallback makes sense
    if (res.status === 401 || res.status === 403) {
      const json = await res.json().catch(() => ({}));
      return NextResponse.json(json, { status: res.status });
    }

    // 404 or 5xx — backend endpoint missing or broken.
    // Fall back to paginating the list and matching by ID so the admin
    // can still view the customer even when the detail endpoint is down.
    console.error(`[customers/${id}] backend returned ${res.status} — falling back to list search`);

    const found = await findCustomerInList(tk, id);
    if (found) return NextResponse.json(found);

    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  } catch (e) {
    console.error(`[customers/${id}] fetch error:`, e instanceof Error ? e.message : String(e));
    // Still try the list fallback on network errors
    try {
      const found = await findCustomerInList(tk, id);
      if (found) return NextResponse.json(found);
    } catch (_) { /* ignore */ }
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}

async function findCustomerInList(
  tk: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  let page = 1;
  while (page <= 20) { // up to 1 000 customers @ per_page=50
    let listRes: Response;
    try {
      listRes = await fetch(`${BASE}/customers?per_page=50&page=${page}`, {
        headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
        cache: "no-store",
      });
    } catch {
      return null;
    }
    if (!listRes.ok) return null;

    const listData = await listRes.json().catch(() => null);
    const rows: Record<string, unknown>[] = Array.isArray(listData?.data)
      ? listData.data
      : Array.isArray(listData)
        ? listData
        : [];

    if (rows.length === 0) return null;

    const match = rows.find((c) => String(c.id) === String(id));
    if (match) return match;

    if (rows.length < 50) return null; // exhausted
    page++;
  }
  return null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tk = await token();
  if (!tk) return unauth();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${BASE}/customers/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tk = await token();
  if (!tk) return unauth();
  const { id } = await params;

  try {
    const res = await fetch(`${BASE}/customers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
