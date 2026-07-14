"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get("admin_token")?.value ?? null;
}

export async function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  name?: string;
}): Promise<{ error?: string }> {
  const token = await getToken();
  if (!token) return { error: "Not authenticated." };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });
  } catch {
    return { error: "Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 403) return { error: "You don't have permission to update this profile." };
  if (!res.ok) return { error: json.message || "Failed to update profile." };

  // Refresh display cookies so the shell avatar updates
  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  };
  const displayVal = data.display_name || data.first_name || data.name || "";
  if (displayVal) cookieStore.set("admin_display_name", displayVal, cookieOpts);
  if (data.name)  cookieStore.set("admin_name", data.name, cookieOpts);

  revalidatePath("/admin/profile");
  return {};
}

export async function updateSignature(
  signatureHtml: string
): Promise<{ error?: string; signatureHtml?: string }> {
  const token = await getToken();
  if (!token) return { error: "Not authenticated." };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/profile/signature`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ signature_html: signatureHtml }),
      cache: "no-store",
    });
  } catch {
    return { error: "Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 422) {
    return { error: json.message ?? json.errors?.signature_html?.[0] ?? "Signature could not be saved." };
  }
  if (res.status === 403) return { error: "You don't have permission to update your signature." };
  if (!res.ok) return { error: json.message || "Failed to save signature." };

  const saved = json.data?.email_signature ?? json.data?.signature_html ?? json.email_signature ?? signatureHtml;
  return { signatureHtml: saved };
}

export async function changePassword(
  current_password: string,
  password: string,
  password_confirmation: string
): Promise<{ error?: string; fieldError?: string }> {
  const token = await getToken();
  if (!token) return { error: "Not authenticated." };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/profile/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ current_password, password, password_confirmation }),
      cache: "no-store",
    });
  } catch {
    return { error: "Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 422) {
    const msg =
      json.errors?.current_password?.[0] ??
      json.message ??
      "Current password is incorrect.";
    return { fieldError: msg };
  }

  if (res.status === 403) return { error: "You don't have permission to perform this action." };
  if (!res.ok) return { error: json.message || "Failed to change password." };

  // Backend returns updated user — clear the must_change_password banner flag
  const user = json.data?.user ?? json.data ?? {};
  if (user.must_change_password === false || user.must_change_password === undefined) {
    const cookieStore = await cookies();
    cookieStore.set("admin_must_change", "0", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  return {};
}
