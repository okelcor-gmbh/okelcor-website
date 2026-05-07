import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const token = request.cookies.get("customer_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { ref } = await params;
  const targetUrl = `${API_URL}/auth/orders/${ref}/declaration/download`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf,application/octet-stream,*/*",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return new NextResponse(errText, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await res.arrayBuffer();
    const responseHeaders = new Headers();
    const contentType = res.headers.get("Content-Type");
    const contentDisposition = res.headers.get("Content-Disposition");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    if (contentDisposition) responseHeaders.set("Content-Disposition", contentDisposition);

    return new NextResponse(body, { status: 200, headers: responseHeaders });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
