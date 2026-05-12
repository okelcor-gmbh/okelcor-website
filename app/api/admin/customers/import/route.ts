import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/customers/import`, {
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
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }

  if (res.status === 401) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  const json = await res.json().catch(() => ({ error: "Unreadable response from server." }));
  return NextResponse.json(json, { status: res.status });
}
