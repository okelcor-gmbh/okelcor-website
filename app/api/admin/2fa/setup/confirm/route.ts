import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

const SESSION_MAX_AGE = 60 * 60 * 5; // 5 hours

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/2fa/setup/confirm
 *
 * Called during the mandatory 2FA setup flow (after the admin has scanned the
 * QR code and entered the first TOTP code to confirm the secret is saved).
 *
 * Reads admin_setup_token (temp cookie set by loginAdmin when the backend
 * returns requires_2fa_setup=true). On success the backend returns a full
 * admin token plus recovery codes; this handler sets the real session cookies
 * and deletes the short-lived setup token.
 *
 * Request body: { code: string }
 * Response:     { recovery_codes: string[] }  (200) | { message: string } (4xx/5xx)
 */
export async function POST(request: NextRequest) {
  const setupToken = request.cookies.get("admin_setup_token")?.value;
  if (!setupToken) {
    return NextResponse.json({ message: "Setup session expired. Please sign in again." }, { status: 401 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/2fa/setup/confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${setupToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Could not reach the server. Please try again." }, { status: 502 });
  }

  const json = await res.json().catch(() => ({})) as Record<string, unknown>;

  if (!res.ok) {
    const msg = typeof json.message === "string" ? json.message : `Verification failed (HTTP ${res.status}).`;
    return NextResponse.json({ message: msg }, { status: res.status });
  }

  // Backend issued a full admin token now that 2FA is configured.
  const fullToken = (json.data as Record<string, unknown> | undefined)?.token as string | undefined;
  if (!fullToken) {
    return NextResponse.json({ message: "Setup succeeded but no session token was returned. Please sign in." }, { status: 502 });
  }

  const admin = ((json.data as Record<string, unknown>)?.user ?? {}) as Record<string, unknown>;
  const recoveryCodes = Array.isArray((json.data as Record<string, unknown>)?.recovery_codes)
    ? (json.data as Record<string, unknown>).recovery_codes as string[]
    : [];

  const isSecure = process.env.NODE_ENV === "production";
  const cookieBase = `; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${isSecure ? "; Secure" : ""}`;

  const response = NextResponse.json({ recovery_codes: recoveryCodes });

  // Full session — httpOnly
  response.headers.append("Set-Cookie", `admin_token=${encodeURIComponent(fullToken)}; HttpOnly${cookieBase}`);

  // Display cookies — readable by client JS
  const adminName    = typeof admin.name === "string" ? admin.name : "";
  const displayName  = (admin.display_name || admin.first_name || admin.name || "") as string;
  const adminRole    = typeof admin.role === "string" ? admin.role : "";
  const roleLabel    = typeof admin.role_label === "string" ? admin.role_label : "";
  const mustChange   = admin.must_change_password ? "1" : "0";

  if (adminName)   response.headers.append("Set-Cookie", `admin_name=${encodeURIComponent(adminName)}${cookieBase}`);
  if (displayName) response.headers.append("Set-Cookie", `admin_display_name=${encodeURIComponent(displayName)}${cookieBase}`);
  if (adminRole)   response.headers.append("Set-Cookie", `admin_role=${encodeURIComponent(adminRole)}${cookieBase}`);
  if (roleLabel)   response.headers.append("Set-Cookie", `admin_role_label=${encodeURIComponent(roleLabel)}${cookieBase}`);
  response.headers.append("Set-Cookie", `admin_must_change=${mustChange}${cookieBase}`);

  // Delete the short-lived setup token
  response.headers.append("Set-Cookie", "admin_setup_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");

  return response;
}
