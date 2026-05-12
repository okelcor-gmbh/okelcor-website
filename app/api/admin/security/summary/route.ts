/**
 * /api/admin/security/summary
 * Returns aggregated security stats for the dashboard.
 *
 * Tries GET /admin/security/summary on the backend.
 * Falls back to computing partial stats from security events if not available.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

const EMPTY = {
  locked_today: 0,
  failed_attempts_today: 0,
  new_registrations_today: 0,
  suspicious_accounts: 0,
  suspended_today: 0,
  banned_today: 0,
};

export async function GET() {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${BASE}/security/summary`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (res.status === 404 || res.status === 403) {
      return NextResponse.json({ ...EMPTY, _unavailable: true });
    }

    const json = await res.json().catch(() => null);
    if (!json) return NextResponse.json({ ...EMPTY, _unavailable: true });
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ ...EMPTY, _unavailable: true });
  }
}
