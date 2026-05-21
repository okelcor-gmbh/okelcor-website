"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  return token;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ArticleLocale = {
  category: string;
  title: string;
  read_time: string;
  summary: string;
  /** HTML string — backend sanitizes before storing */
  body: string;
  cover_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

export type ArticleInput = {
  slug: string;
  published_at: string;
  is_published: boolean;
  sort_order: number;
  translations: {
    en: ArticleLocale;
    de?: ArticleLocale;
    fr?: ArticleLocale;
    es?: ArticleLocale;
  };
};

// ── Error helpers ─────────────────────────────────────────────────────────────

/**
 * Turn a Laravel error response into a readable string.
 * Handles both plain { message } and validation { message, errors: { field: string[] } } shapes.
 */
function extractError(json: Record<string, unknown>, status: number): string {
  const message = (json.message as string | undefined) || `Request failed (HTTP ${status}).`;
  const errors = json.errors as Record<string, string[]> | undefined;
  if (!errors || typeof errors !== "object") return message;

  const lines = Object.entries(errors).flatMap(([field, msgs]) => {
    const label = field
      .replace(/^translations\.\w+\./, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return (msgs as string[]).map((m) => `${label}: ${m}`);
  });

  return lines.length ? `${message}\n${lines.join("\n")}` : message;
}

// ── CRUD actions ──────────────────────────────────────────────────────────────

export async function createArticle(
  data: ArticleInput
): Promise<{ error?: string; id?: number }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: extractError(json, res.status) };
  }

  revalidatePath("/admin/articles");
  return { id: json.data?.id };
}

export async function updateArticle(
  id: number,
  data: ArticleInput
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/articles/${id}`, {
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
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: extractError(json, res.status) };
  }

  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/admin/articles");
  return {};
}

export async function deleteArticle(
  id: number
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/articles/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  if (!res.ok && res.status !== 204) {
    const json = await res.json().catch(() => ({}));
    return { error: json.message || `Failed to delete article (HTTP ${res.status}).` };
  }

  revalidatePath("/admin/articles");
  return {};
}

export async function toggleArticlePublished(
  id: number,
  published: boolean
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/articles/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_published: published }),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || "Failed to toggle published status." };
  }

  revalidatePath("/admin/articles");
  return {};
}

// ── Image upload ──────────────────────────────────────────────────────────────

/**
 * Upload or replace the article's primary image.
 * FormData must contain a single "image" file entry.
 * Do NOT set Content-Type — the runtime sets the multipart boundary.
 */
export async function uploadArticleImage(
  articleId: number,
  formData: FormData
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/articles/${articleId}/image`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not upload image." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || "Failed to upload image." };
  }

  revalidatePath(`/admin/articles/${articleId}`);
  revalidatePath("/news", "page");
  revalidatePath("/news/[slug]", "page");
  return {};
}

/** Upload or replace the article's OG / social-share image. */
export async function uploadOgImage(
  articleId: number,
  formData: FormData
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/articles/${articleId}/og-image`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not upload OG image." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || "Failed to upload OG image." };
  }

  revalidatePath(`/admin/articles/${articleId}`);
  return {};
}

export async function restoreArticle(
  id: number
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/articles/${id}/restore`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || `Failed to restore article (HTTP ${res.status}).` };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/articles/trash");
  revalidatePath("/news", "page");
  return {};
}
