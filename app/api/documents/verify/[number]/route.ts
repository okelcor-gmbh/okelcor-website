import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;

  try {
    const res = await fetch(
      `${API_URL}/documents/verify/${encodeURIComponent(number)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Verification service unavailable" },
      { status: 503 },
    );
  }
}
