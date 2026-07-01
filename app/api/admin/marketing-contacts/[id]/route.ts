/**
 * DELETE /api/admin/marketing-contacts/[id]
 * → DELETE /admin/marketing-contacts/{id}
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;

  try {
    const res = await fetch(`${BASE}/marketing-contacts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
    });

    if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });
    if (res.status === 204) return NextResponse.json({ message: "Contact removed." }, { status: 200 });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }
}
