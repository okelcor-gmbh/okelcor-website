/**
 * GET  /api/admin/marketing-contacts   — paginated contact list
 * POST /api/admin/marketing-contacts   — either import CSV/TXT (multipart)
 *                                         or create one contact (JSON body),
 *                                         branched on Content-Type
 *
 * Proxies to:
 *   GET  /admin/marketing-contacts?status=&company=&country=&market=&search=&per_page=&page=
 *   POST /admin/marketing-contacts/import   (multipart: file, market)
 *   POST /admin/marketing-contacts          (JSON: email, market, ...optional)
 *
 * The import path normalises the CSV before forwarding:
 *   1. Strips the UTF-8 BOM (ef bb bf / U+FEFF) that Excel/Wix sometimes prepend
 *   2. Trims leading/trailing whitespace from every header cell
 *   3. Maps alternative column names to the canonical Wix/backend names so that
 *      plain exports (e.g. "Company name", "Bussines type") land correctly
 *
 * `market` is required by the backend on import — a CSV import without one
 * 422s. Note: the backend does NOT normalise (slugify) a market value that
 * comes from inside the CSV's own market/region/segment column, only ones
 * supplied directly (here, or via manual create/update) — so a CSV-embedded
 * "Asia" and a manually-entered "asia" won't match each other server-side.
 * Known backend gap, not something this proxy can fix.
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

// Maps trimmed-lowercase input header → exact column name the backend expects.
// The backend JSON schema uses snake_case lowercase ("email", "company", "source")
// so all canonical values here are lowercase to match.
const HEADER_MAP: Record<string, string> = {
  // email
  "email":          "email",
  "e-mail":         "email",
  "email address":  "email",
  "email 1":        "email",
  // company
  "company":        "company",
  "company name":   "company",
  "business name":  "company",
  "businessname":   "company",
  // name
  "first name":     "first_name",
  "firstname":      "first_name",
  "last name":      "last_name",
  "lastname":       "last_name",
  // phone
  "phone":          "phone",
  "phone 1":        "phone",
  "mobile":         "phone",
  // country
  "country":        "country",
  "country/region": "country",
  // source / labels
  "source":         "source",
  "source type":    "source",
  "bussines type":  "source",  // misspelling in contacts.csv
  "business type":  "source",
  "labels":         "labels",
  "label":          "labels",
  "tags":           "labels",
  // vat
  "vat":            "vat_id",
  "vat id":         "vat_id",
  "vat number":     "vat_id",
};

function normaliseContactsCsv(raw: string): string {
  // 1. Strip UTF-8 BOM (U+FEFF) — use charCodeAt so the check works regardless
  //    of how the source file itself is encoded.
  const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;

  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const lines   = text.split(newline);
  if (lines.length === 0) return text;

  // 2. Trim every header cell and remap to backend field names.
  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => {
    const trimmed   = h.trim();
    const canonical = HEADER_MAP[trimmed.toLowerCase()];
    // Unknown headers: pass through as lowercase so the backend can still try
    return canonical ?? trimmed.toLowerCase();
  });

  lines[0] = headers.join(",");
  return lines.join(newline);
}

async function getToken() {
  const store = await cookies();
  return store.get("admin_token")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const tk = await getToken();
  if (!tk) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const incoming = req.nextUrl.searchParams;
  const allowed = ["status", "company", "country", "market", "search", "per_page", "page"] as const;
  const qs = new URLSearchParams();
  for (const key of allowed) {
    const v = incoming.get(key);
    if (v) qs.set(key, v);
  }

  try {
    const res = await fetch(`${BASE}/marketing-contacts?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });
      if (res.status === 404 || res.status === 405) {
        return NextResponse.json({ data: [], meta: { total: 0, current_page: 1, last_page: 1 } }, { status: 200 });
      }
      const json = await res.json().catch(() => ({}));
      return NextResponse.json(json, { status: res.status });
    }

    const json = await res.json().catch(() => ({ data: [], meta: {} }));
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0, current_page: 1, last_page: 1 } }, { status: 200 });
  }
}

// JSON body → single manual contact create (backend's plain
// POST /admin/marketing-contacts). Multipart → CSV import (below). One URL
// on the frontend side; which backend endpoint it hits is an implementation
// detail this proxy layer absorbs.
async function postCreate(req: NextRequest, tk: string) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/marketing-contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });

    const json = await res.json().catch(() => ({ error: "Unreadable response from server." }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }
}

async function postImport(req: NextRequest, tk: string) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse the uploaded file." }, { status: 400 });
  }

  const rawFile = formData.get("file");
  if (!rawFile || !(rawFile instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // Required by the backend now — a CSV import with no market silently
  // 422s otherwise. The UI must always send one alongside the file.
  const market = formData.get("market");
  if (!market || typeof market !== "string") {
    return NextResponse.json({ error: "A market must be selected before importing." }, { status: 400 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum upload size is 10 MB." }, { status: 413 });
  }

  // Read and normalise the CSV text before forwarding
  const rawText      = await rawFile.text();
  const normalisedText = normaliseContactsCsv(rawText);
  const normalisedFile = new File([normalisedText], rawFile.name, { type: "text/csv" });

  const outForm = new FormData();
  outForm.append("file", normalisedFile);
  outForm.append("market", market);

  try {
    const res = await fetch(`${BASE}/marketing-contacts/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tk}`,
        Accept: "application/json",
        // Do NOT set Content-Type — fetch sets multipart boundary automatically
      },
      body: outForm,
    });

    if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });

    const json = await res.json().catch(() => ({ error: "Unreadable response from server." }));

    // Normalise: backend may wrap in { data: {...}, message: "..." }
    const payload = json?.data && typeof json.data === "object"
      ? { ...json.data, message: json.message ?? json.data.message }
      : json;

    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const tk = await getToken();
  if (!tk) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return postCreate(req, tk);
  }
  return postImport(req, tk);
}
