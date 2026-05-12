import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE =
  `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET(req: NextRequest) {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  try {
    const res = await fetch(`${BASE}/security/login-history${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (res.status === 404 || res.status === 403) {
      return NextResponse.json({ _unavailable: true });
    }

    const json = await res.json().catch(() => null);
    if (!json) return NextResponse.json({ _unavailable: true });
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ _unavailable: true });
  }
}
