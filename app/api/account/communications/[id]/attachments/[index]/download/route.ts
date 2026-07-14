import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  const token = request.cookies.get("customer_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id, index } = await params;

  try {
    const res = await fetch(
      `${API_URL}/auth/customer/communications/${id}/attachments/${index}/download`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/octet-stream,*/*",
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
    const cd = res.headers.get("Content-Disposition");
    if (ct) headers.set("Content-Type", ct);
    if (cd) headers.set("Content-Disposition", cd);
    return new NextResponse(body, { status: 200, headers });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
