"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

// ── Login ─────────────────────────────────────────────────────────────────────

/**
 * Authenticates an admin user against POST /api/v1/admin/login.
 *
 * On success: sets httpOnly admin_token cookie and redirects to /admin.
 * On 2FA required: returns { requires_2fa: true, session_token } — no redirect.
 * On failure: returns { error: string }.
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<{ error: string } | { requires_2fa: true; session_token: string } | void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "Could not reach the server. Please try again." };
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      error:
        json.message ||
        (res.status === 422 ? "Invalid credentials. Please try again." : "Login failed."),
    };
  }

  // Backend signals that 2FA verification is required before a full token is issued.
  // Contract: { requires_2fa: true, data: { session_token: "uuid" } }
  if (json.requires_2fa === true) {
    console.log("[loginAdmin] 2FA required — response shape:", JSON.stringify({
      requires_2fa: json.requires_2fa,
      data_keys: json.data ? Object.keys(json.data) : null,
    }));
    const sessionToken: string = json.data?.session_token ?? "";
    if (!sessionToken) return { error: "2FA session could not be started. Please try logging in again." };
    return { requires_2fa: true, session_token: sessionToken };
  }

  const token: string | undefined = json.data?.token;
  if (!token) {
    return { error: "Authentication failed. No token received." };
  }

  const cookieStore = await cookies();

  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  const admin = json.data?.user ?? {};

  // Store display name — prefer display_name, then first_name, then name
  const adminName: string | undefined = admin.name;
  const displayName: string =
    admin.display_name || admin.first_name || admin.name || "";
  const cookieOpts = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  };

  if (adminName)   cookieStore.set("admin_name",         adminName,   cookieOpts);
  if (displayName) cookieStore.set("admin_display_name", displayName, cookieOpts);

  const adminRole: string | undefined = admin.role;
  if (adminRole) cookieStore.set("admin_role", adminRole, cookieOpts);

  // Store human-readable role label from API (e.g. "Super Admin")
  const roleLabel: string | undefined = admin.role_label;
  if (roleLabel) cookieStore.set("admin_role_label", roleLabel, cookieOpts);

  // Track must_change_password so the shell can show a persistent banner
  cookieStore.set("admin_must_change", admin.must_change_password ? "1" : "0", cookieOpts);

  if (admin.must_change_password) {
    redirect("/admin/change-password");
  }

  const isFirstLogin = !admin.last_login_at;
  redirect(isFirstLogin ? "/admin/profile?first_login=1" : "/admin");
}

// ── Logout ────────────────────────────────────────────────────────────────────

/**
 * Deletes admin session cookies and redirects to /admin/login.
 * Used as a <form> action in the AdminShell sidebar.
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  cookieStore.delete("admin_name");
  cookieStore.delete("admin_display_name");
  cookieStore.delete("admin_role");
  cookieStore.delete("admin_role_label");
  cookieStore.delete("admin_must_change");
  redirect("/admin/login");
}

// ── 2FA login challenge ───────────────────────────────────────────────────────

/**
 * Validates a TOTP code against the session_token issued by the initial login step.
 * On success: sets full admin session cookies and redirects to /admin.
 * On failure: returns { error: string }.
 */
export async function submitAdminTwoFactor(
  sessionToken: string,
  code: string
): Promise<{ error: string } | void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/login/2fa`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ session_token: sessionToken, code }),
      cache: "no-store",
    });
  } catch {
    return { error: "Could not reach the server. Please try again." };
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw: string | undefined = json.message;

    if (res.status >= 500) {
      // Never expose raw Laravel "Server Error" — backend logs have the real cause
      return { error: "A server error occurred during verification. Please try again, or contact support if this persists." };
    }
    if (res.status === 419) {
      return { error: "Session expired. Please sign in again." };
    }
    if (res.status === 429) {
      return { error: "Too many attempts. Please wait a moment and try again." };
    }
    if (res.status === 422) {
      if (raw?.toLowerCase().includes("session")) {
        return { error: "Your 2FA session has expired. Please sign in again." };
      }
      if (raw?.toLowerCase().includes("not configured") || raw?.toLowerCase().includes("no secret")) {
        return { error: "2FA is not configured on this account. Contact your super admin." };
      }
      return { error: raw || "Invalid or expired code. Please try again." };
    }
    return { error: raw || "Verification failed. Please try again." };
  }

  const token: string | undefined = json.data?.token;
  if (!token) return { error: "Verification failed. No token received." };

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  };

  cookieStore.set("admin_token", token, { ...cookieOpts, httpOnly: true });

  const admin = json.data?.user ?? {};
  const adminName: string | undefined = admin.name;
  const displayName: string = admin.display_name || admin.first_name || admin.name || "";

  if (adminName)   cookieStore.set("admin_name",         adminName,   cookieOpts);
  if (displayName) cookieStore.set("admin_display_name", displayName, cookieOpts);

  const adminRole: string | undefined = admin.role;
  if (adminRole) cookieStore.set("admin_role", adminRole, cookieOpts);

  const roleLabel: string | undefined = admin.role_label;
  if (roleLabel) cookieStore.set("admin_role_label", roleLabel, cookieOpts);

  cookieStore.set("admin_must_change", admin.must_change_password ? "1" : "0", cookieOpts);

  if (admin.must_change_password) redirect("/admin/change-password");

  const isFirstLogin = !admin.last_login_at;
  redirect(isFirstLogin ? "/admin/profile?first_login=1" : "/admin");
}
