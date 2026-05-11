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

  // Correct authenticated customer endpoint — must include /auth/ prefix.
  // The previous route used /invoices/{id}/download (no auth prefix) which
  // Laravel could not match to an authenticated route, causing a 404/403
  // and triggering the generic frontend fallback message.
  const targetUrl = `${API_URL}/auth/invoices/${id}/download`;

  console.log("[invoice-download] target URL    :", targetUrl);
  console.log("[invoice-download] token present :", !!token);

  try {
    const upstream = await fetch(targetUrl, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf,application/octet-stream,*/*",
      },
    });

    const upstreamContentType = upstream.headers.get("Content-Type") ?? "";

    console.log("[invoice-download] upstream status      :", upstream.status);
    console.log("[invoice-download] upstream content-type:", upstreamContentType);
    console.log(
      "[invoice-download] upstream content-length:",
      upstream.headers.get("Content-Length") ?? "(not sent)",
    );

    if (!upstream.ok) {
      // Surface the real upstream error so it is visible in the browser and
      // in server logs — never swallow it with a generic fallback.
      const errorBody = await upstream.text().catch(() => "");
      console.error(
        "[invoice-download] upstream error body:",
        errorBody.slice(0, 500),
      );

      let message: string;
      try {
        const parsed = JSON.parse(errorBody);
        message = parsed?.message ?? parsed?.error ?? (errorBody || "Invoice unavailable.");
      } catch {
        message = errorBody || "Invoice unavailable.";
      }

      return NextResponse.json(
        { message, upstream_status: upstream.status },
        { status: upstream.status },
      );
    }

    // Stream the PDF regardless of whether Content-Length is present.
    const body = await upstream.arrayBuffer();

    // Extract filename from upstream Content-Disposition if provided;
    // fall back to a sensible default.
    const backendCd = upstream.headers.get("Content-Disposition") ?? "";
    const fnMatch = backendCd.match(/filename[^;=\n]*=["']?([^"';\n]+)/i);
    const filename = fnMatch?.[1]?.trim() ?? `invoice-${id}.pdf`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        // Always set to application/pdf — do not forward a wrong or missing
        // content-type from the upstream response.
        "Content-Type": "application/pdf",
        // inline → browser opens PDF in a new tab instead of downloading.
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[invoice-download] fetch error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
