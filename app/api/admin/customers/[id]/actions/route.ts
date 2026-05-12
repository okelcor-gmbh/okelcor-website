/**
 * /api/admin/customers/[id]/actions
 * POST { action: "suspend"|"ban"|"activate"|"unlock"|"logout_all"|"force_password_reset" }
 *
 * Backend must implement:
 *   POST /admin/customers/{id}/suspend
 *   POST /admin/customers/{id}/ban
 *   POST /admin/customers/{id}/activate
 *   POST /admin/customers/{id}/unlock
 *   POST /admin/customers/{id}/logout-all
 *   POST /admin/customers/{id}/force-password-reset
 *
 *   Suspend/ban must invalidate all active sessions.
 *   Force password reset must send reset email and invalidate current session.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

const ACTION_PATH: Record<string, string> = {
  suspend:               "/suspend",
  ban:                   "/ban",
  activate:              "/activate",
  unlock:                "/unlock",
  logout_all:            "/logout-all",
  force_password_reset:  "/force-password-reset",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body: { action?: string; reason?: string } = await req.json().catch(() => ({}));
  const { action, reason } = body;

  const path = action ? ACTION_PATH[action] : null;
  if (!path) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/customers/${id}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ reason: reason ?? null }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
