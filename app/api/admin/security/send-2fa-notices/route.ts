import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE =
  `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function POST() {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${BASE}/security/send-2fa-notices`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    const json = await res.json().catch(() => null);
    if (!json) return NextResponse.json({ message: "No response from server." }, { status: 502 });
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
