import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

// Fallback templates used when backend endpoint is unavailable
const FALLBACK_TEMPLATES = [
  { key: "follow_up_quote",          label: "Follow up on quote",             subject: "Following up on your tyre inquiry — {ref}",                body: "" },
  { key: "request_more_information", label: "Request more information",        subject: "More information needed for your tyre request — {ref}",    body: "" },
  { key: "quote_ready",              label: "Quote ready",                     subject: "Your tyre quote is ready — {ref}",                         body: "" },
  { key: "invite_to_register",       label: "Invite to register",              subject: "Your Okelcor account is ready",                            body: "" },
  { key: "payment_reminder",         label: "Payment reminder",                subject: "Reminder: payment due for your order — {ref}",             body: "" },
  { key: "document_available",       label: "Document available",              subject: "Your trade document is now available — {ref}",             body: "" },
];

type RawTemplate = Record<string, unknown>;

// Normalise any backend shape → { key, label, subject, body }
function normalizeTemplate(raw: RawTemplate) {
  return {
    key:     String(raw.key     ?? raw.slug  ?? raw.name  ?? ""),
    label:   String(raw.label   ?? raw.title ?? raw.name  ?? raw.key ?? ""),
    subject: String(raw.subject ?? raw.email_subject ?? raw.subject_line ?? ""),
    body:    String(raw.body    ?? raw.content ?? raw.email_body ?? raw.template_body ?? ""),
  };
}

export async function GET() {
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json({ data: FALLBACK_TEMPLATES });
  try {
    const res = await fetch(`${BASE}/crm/email-templates`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ data: FALLBACK_TEMPLATES });
    const json = await res.json().catch(() => ({}));
    const raw: RawTemplate[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    if (raw.length === 0) return NextResponse.json({ data: FALLBACK_TEMPLATES });
    return NextResponse.json({ data: raw.map(normalizeTemplate) });
  } catch { return NextResponse.json({ data: FALLBACK_TEMPLATES }); }
}
