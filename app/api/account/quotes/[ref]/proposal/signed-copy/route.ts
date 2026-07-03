/**
 * Customer — upload the signed/stamped Proposal back to Okelcor. This is itself
 * an acceptance (same effect as POST /auth/quotes/{ref}/accept-proposal).
 * POST → POST /auth/quotes/{ref}/proposal/signed-copy   multipart: file (pdf/jpg/jpeg/png, max 20MB)
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
    const res = await fetch(`${API_URL}/auth/quotes/${ref}/proposal/signed-copy`, {
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
