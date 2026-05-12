import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function GET() {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${API_URL}/admin/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({})) as { message?: string; data?: unknown };

    // Backend enforces 2FA — surface a structured flag so the shell can redirect.
    if (res.status === 403) {
      const msg = (json.message ?? "").toLowerCase();
      if (msg.includes("two-factor") || msg.includes("2fa")) {
        return NextResponse.json({ two_factor_required: true }, { status: 403 });
      }
      return NextResponse.json(json, { status: 403 });
    }

    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
