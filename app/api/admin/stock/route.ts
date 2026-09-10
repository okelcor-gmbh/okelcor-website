/**
 * GET  /api/admin/stock                    → GET  /admin/stock
 * POST /api/admin/stock?op=supplier-invoice → POST /admin/stock/supplier-invoice
 * POST /api/admin/stock?op=customer-invoice → POST /admin/stock/customer-invoice
 *
 * The finance stock ledger proxy. Token from the httpOnly cookie.
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function token(): Promise<string | null> {
  const store = await cookies();
  return store.get("admin_token")?.value ?? null;
}

export async function GET() {
  const tk = await token();
  if (!tk) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const res = await fetch(`${API_URL}/admin/stock`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${tk}` },
    cache: "no-store",
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}

export async function POST(request: NextRequest) {
  const tk = await token();
  if (!tk) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const op = request.nextUrl.searchParams.get("op");
  if (op !== "supplier-invoice" && op !== "customer-invoice") {
    return NextResponse.json({ message: "Unknown operation." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const res = await fetch(`${API_URL}/admin/stock/${op}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${tk}` },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
