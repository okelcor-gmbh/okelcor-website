import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const search = request.nextUrl.search;

  try {
    const res = await fetch(`${API_URL}/admin/customers${search}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    const json = await res.json().catch(() => ({ error: "Unreadable response." }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }
}

/**
 * POST /api/admin/customers — admin-initiated customer onboarding.
 *
 * Backend must implement:
 *   POST /admin/customers
 *     body: {
 *       customer_type: "b2b" | "b2c",
 *       first_name, last_name?, email,
 *       company_name?, phone?, country?,
 *       access_level?,            // CRM-4 — defaults to approved_buyer
 *       onboarding_status?,       // defaults to "approved"
 *       send_invitation: boolean, // email a set-password / activation link
 *       notes?, created_via: "admin"
 *     }
 *
 *   - Create the customer WITHOUT a password.
 *   - When send_invitation is true: generate a single-use invitation token and
 *     email the customer a set-password link so they can access the portal.
 *   - Reject duplicate emails with 422 { message, errors: { email: [...] } }.
 *   - Return 201 { data: <customer> }.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/admin/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (res.status === 401) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    const json = await res.json().catch(() => ({ error: "Unreadable response." }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }
}
