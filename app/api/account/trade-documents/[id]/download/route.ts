import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get("customer_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const res = await fetch(
      `${API_URL}/auth/trade-documents/${id}/download`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf,application/octet-stream,*/*",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      return new NextResponse(errText, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await res.arrayBuffer();
    const headers = new Headers();
    const ct = res.headers.get("Content-Type");
    if (ct) headers.set("Content-Type", ct);

    // Parse filename from backend header, fall back to a sensible default.
    const backendCd = res.headers.get("Content-Disposition") ?? "";
    const fnMatch = backendCd.match(/filename[^;=\n]*=["']?([^"';\n]+)/i);
    const filename = fnMatch?.[1]?.trim() ?? `document-${id}.pdf`;
    // Serve inline so the browser opens the PDF in a new tab instead of
    // forcing a download. JS-initiated blob downloads (proforma/packing list)
    // are unaffected — the JS-created <a download="…"> overrides this header.
    headers.set("Content-Disposition", `inline; filename="${filename}"`);

    return new NextResponse(body, { status: 200, headers });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
