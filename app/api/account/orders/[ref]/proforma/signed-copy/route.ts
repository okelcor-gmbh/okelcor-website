/**
 * Customer — upload the signed/stamped Proforma Invoice back to Okelcor.
 * POST → POST /auth/orders/{ref}/proforma/signed-copy   multipart: file (pdf/jpg/jpeg/png, max 20MB)
 * Re-uploading replaces the previous signed copy (old one marked superseded, not deleted).
 */
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    // Forward the multipart form data directly — fetch sets Content-Type with boundary.
    const res = await fetch(`${API_URL}/auth/orders/${ref}/proforma/signed-copy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
      cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
