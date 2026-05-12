/**
 * GET /api/admin/products/export
 *
 * Proxy to GET /api/v1/admin/products/export on the Laravel backend.
 * Reads admin_token from the httpOnly cookie server-side, then streams
 * the CSV response back to the browser with the correct headers so the
 * browser triggers a file download.
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Forward segment filter (b2b | b2c) to the Laravel export endpoint
  const segment = request.nextUrl.searchParams.get("segment");
  const exportUrl = new URL(`${API_URL}/admin/products/export`);
  if (segment === "b2b" || segment === "b2c") {
    exportUrl.searchParams.set("segment", segment);
  }

  let res: Response;
  try {
    res = await fetch(exportUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/csv, application/csv, */*",
      },
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

  if (!res.ok) {
    return NextResponse.json(
      { error: `Export failed (HTTP ${res.status}).` },
      { status: res.status }
    );
  }

  // Forward the CSV body and preserve Content-Disposition so the browser
  // downloads the file rather than trying to display it inline.
  const date = new Date().toISOString().slice(0, 10);
  const segmentSuffix = segment === "b2b" ? "-b2b" : segment === "b2c" ? "-b2c" : "";
  const contentDisposition =
    res.headers.get("content-disposition") ??
    `attachment; filename="products${segmentSuffix}-${date}.csv"`;

  return new NextResponse(res.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": contentDisposition,
    },
  });
}
