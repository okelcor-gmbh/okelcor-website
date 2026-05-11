import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("customer_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetUrl = `${API_URL}/invoices/${id}/download`;

  console.log("[invoice-download] token present :", !!token);
  console.log("[invoice-download] target URL    :", targetUrl);

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf,application/octet-stream,*/*",
      },
      cache: "no-store",
    });

    console.log("[invoice-download] Laravel status :", res.status);
    console.log("[invoice-download] content-type   :", res.headers.get("Content-Type"));

    if (!res.ok) {
      const errText = await res.text();
      console.log("[invoice-download] error body     :", errText.slice(0, 300));
      // 423 = invoice exists but not yet released (reverse-charge, pending certificate)
      const message =
        res.status === 423
          ? "This invoice is not yet available. It will be released after your EU Entry Certificate is acknowledged."
          : "Unable to retrieve invoice PDF.";
      return NextResponse.json({ message }, { status: res.status });
    }

    const body = await res.arrayBuffer();
    const responseHeaders = new Headers();

    const contentType = res.headers.get("Content-Type");
    if (contentType) responseHeaders.set("Content-Type", contentType);

    // Parse filename from backend header, fall back to a sensible default.
    const backendCd = res.headers.get("Content-Disposition") ?? "";
    const fnMatch = backendCd.match(/filename[^;=\n]*=["']?([^"';\n]+)/i);
    const filename = fnMatch?.[1]?.trim() ?? `invoice-${id}.pdf`;
    // Always serve inline so the browser opens the PDF in a new tab instead
    // of forcing a download.
    responseHeaders.set("Content-Disposition", `inline; filename="${filename}"`);

    return new NextResponse(body, { status: 200, headers: responseHeaders });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
