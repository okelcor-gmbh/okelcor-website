/**
 * Customer notifications — dismiss (hide) one notification.
 * POST → POST /auth/customer/notifications/{id}/dismiss
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await cookies();
  const token = store.get("customer_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${API_URL}/auth/customer/notifications/${id}/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
