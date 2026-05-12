/**
 * POST /api/admin/promotions-upload?promotionId=X
 *
 * Streaming proxy for promotion image uploads.
 * Reads the admin_token from the httpOnly cookie server-side,
 * then pipes the multipart body directly to Laravel.
 */

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const promotionId = request.nextUrl.searchParams.get("promotionId");
  if (!promotionId) {
    return NextResponse.json(
      { error: "Missing promotionId parameter." },
      { status: 400 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  let res: Response;
  try {
    res = await fetch(
      `${API_URL}/admin/promotions/${promotionId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "content-type": contentType,
        },
        body: request.body,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore  Node 18+ requires duplex when body is a ReadableStream
        duplex: "half",
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach the API server." },
      { status: 502 }
    );
  }

  const json = await res.json().catch(() => ({}));

  if (res.ok) {
    revalidatePath("/admin/promotions");
    revalidatePath("/shop");
  }

  return NextResponse.json(json, { status: res.status });
}
