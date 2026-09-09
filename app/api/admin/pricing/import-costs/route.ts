/**
 * POST /api/admin/pricing/import-costs
 *
 * Proxy to POST /api/v1/admin/pricing/import-costs on the Laravel
 * backend: the Tyre100 cost refresh (CSV with sku/ean + cost columns,
 * updates cost_price only). Streams the multipart body through with the
 * admin token from the httpOnly cookie.
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Could not read the upload." }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/admin/pricing/import-costs`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    body: form,
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
