import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

// Client-side fallback templates — used when backend endpoint not yet deployed
const FALLBACK_TEMPLATES = [
  { key: "follow_up_quote",          label: "Follow-up: Quote",              subject: "Following up on your tyre inquiry" },
  { key: "request_more_information", label: "Request More Information",       subject: "We need a few more details for your quote" },
  { key: "invite_to_register",       label: "Invite to Register",             subject: "Your Okelcor account is ready" },
  { key: "quote_ready",              label: "Quote Ready",                    subject: "Your Okelcor quote is ready" },
  { key: "payment_reminder",         label: "Payment Reminder",               subject: "Reminder: payment due for your order" },
  { key: "document_available",       label: "Document Available",             subject: "Your trade document is now available" },
];

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
    return NextResponse.json({ data: json.data ?? json ?? FALLBACK_TEMPLATES });
  } catch { return NextResponse.json({ data: FALLBACK_TEMPLATES }); }
}
