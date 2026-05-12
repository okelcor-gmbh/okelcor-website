/**
 * POST /api/admin/products/import
 *
 * Proxy to POST /api/v1/admin/products/import on the Laravel backend.
 * Reads admin_token from the httpOnly cookie server-side.
 *
 * CSV normalisation applied before forwarding:
 *  - Renames "visible" header → "is_active"
 *  - Converts Python-style booleans "True"/"False" → "1"/"0"
 *
 * Optional query param: ?segment=b2b|b2c
 *  - Forwarded to Laravel so it can store the price column in the
 *    correct pricing tier field (price_b2b / price_b2c).
 *
 * Expected response shape from the backend:
 * {
 *   imported: number,
 *   updated:  number,
 *   skipped:  number,
 *   errors:   { row: number; message: string }[]
 * }
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Allow up to 5 minutes for large CSV imports (Vercel Pro required for > 60s)
export const maxDuration = 300;

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Forward segment to Laravel so it stores the price column in price_b2b / price_b2c
  const segment = request.nextUrl.searchParams.get("segment");
  const importUrl = new URL(`${API_URL}/admin/products/import`);
  if (segment === "b2b" || segment === "b2c") {
    importUrl.searchParams.set("segment", segment);
  }

  // ── Parse and normalise the CSV ───────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse the uploaded file." }, { status: 400 });
  }

  const rawFile = formData.get("file");
  if (!rawFile || !(rawFile instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  let csvText = await rawFile.text();

  // 1. Rename "visible" header to "is_active" (first line only)
  const firstNewline = csvText.indexOf("\n");
  if (firstNewline !== -1) {
    const header = csvText.slice(0, firstNewline).replace(/\bvisible\b/, "is_active");
    csvText = header + csvText.slice(firstNewline);
  }

  // 2. Convert Python-style booleans to numeric 1/0
  //    The description field is always quoted so ,True, and ,False, only
  //    appear at real column boundaries — safe to replace globally.
  csvText = csvText
    .replace(/,True,/g, ",1,")
    .replace(/,False,/g, ",0,")
    .replace(/,True\r?\n/g, (m) => ",1" + m.slice(",True".length))
    .replace(/,False\r?\n/g, (m) => ",0" + m.slice(",False".length));

  // ── Forward to Laravel ────────────────────────────────────────────────────
  const outForm = new FormData();
  outForm.append("file", new File([csvText], rawFile.name, { type: "text/csv" }));

  let res: Response;
  try {
    res = await fetch(importUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        // Do NOT set Content-Type — fetch sets it with the multipart boundary
      },
      body: outForm,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the API server." },
      { status: 502 }
    );
  }

  if (res.status === 401) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  const json = await res.json().catch(() => ({
    error: "The server returned an unreadable response.",
  }));

  if (res.ok) {
    revalidatePath("/shop", "page");
    revalidatePath("/shop/[id]", "page");
    revalidatePath("/admin/products");
  }

  // Backend wraps the result in { data: { imported, updated, skipped, errors }, message }
  // Normalise to the flat shape the frontend expects.
  const normalized =
    json?.data && typeof json.data === "object"
      ? { ...json.data, message: json.message ?? json.data.message }
      : json;

  return NextResponse.json(normalized, { status: res.status });
}
