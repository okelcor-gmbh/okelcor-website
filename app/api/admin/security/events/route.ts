/**
 * /api/admin/security/events
 * Proxies GET /admin/security/events from the backend.
 *
 * Backend must implement this endpoint returning:
 * {
 *   data: SecurityEvent[],
 *   meta: { total, current_page, last_page, per_page }
 * }
 *
 * SecurityEvent shape:
 * {
 *   id, type, customer_id?, customer_email?, ip_address?,
 *   user_agent?, location?, description, created_at, severity
 * }
 *
 * Backend security rules to implement:
 * - Lock account after 5 consecutive failed logins (emit account_lockout event)
 * - Auto-suspend after 10+ failed logins in 1 hour (emit suspicious_activity event)
 * - Log every login attempt (IP, device, timestamp)
 * - Log every admin action on a customer account
 * - On suspend/ban: invalidate all active sessions
 * - Flag email + IP on ban
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET(req: NextRequest) {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp  = req.nextUrl.searchParams;
  const url = new URL(`${BASE}/security/events`);
  ["type", "page", "per_page", "customer_id"].forEach(k => {
    const v = sp.get(k); if (v) url.searchParams.set(k, v);
  });

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);

    if (res.status === 404 || res.status === 403 || !json) {
      return NextResponse.json({ data: [], meta: { total: 0 }, _unavailable: true });
    }
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0 }, _unavailable: true });
  }
}
