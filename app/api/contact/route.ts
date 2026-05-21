import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { COMPANY_NAME, COMPANY_LEGAL_NAME, COMPANY_EMAIL, COMPANY_NOREPLY_EMAIL, COMPANY_ADDRESS_STREET, COMPANY_ADDRESS_CITY } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site-settings";
import { rateLimit, retryAfter, getClientIp, rateLimitResponse, warnRateLimit } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || `${COMPANY_NAME} Website <${COMPANY_NOREPLY_EMAIL}>`;

// ─── Server-side validation ────────────────────────────────────────────────────

function validate(body: unknown): { name: string; email: string; subject: string; inquiry: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const subject = typeof b.subject === "string" ? b.subject.trim() : "";
  const inquiry = typeof b.inquiry === "string" ? b.inquiry.trim() : "";

  if (!name || !email || !subject || !inquiry) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  return { name, email, subject, inquiry };
}

// ─── HTML email template ───────────────────────────────────────────────────────

function buildHtml(data: { name: string; email: string; subject: string; inquiry: string }): string {
  const timestamp = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/Berlin",
    dateStyle: "full",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#171a20;padding:32px 40px;">
            <div style="display:inline-block;width:28px;height:4px;background:#f4511e;border-radius:2px;margin-bottom:16px;"></div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">
              New Contact Inquiry
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.55);font-size:13px;">
              Submitted via okelcor.com/contact
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:24px;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f4511e;">From</p>
                  <p style="margin:0;font-size:16px;font-weight:600;color:#171a20;">${escHtml(data.name)}</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#5c5e62;">
                    <a href="mailto:${escHtml(data.email)}" style="color:#f4511e;text-decoration:none;">${escHtml(data.email)}</a>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:24px 0;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f4511e;">Subject</p>
                  <p style="margin:0;font-size:15px;color:#171a20;">${escHtml(data.subject)}</p>
                </td>
              </tr>

              <tr>
                <td style="padding:24px 0;">
                  <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f4511e;">Message</p>
                  <p style="margin:0;font-size:15px;line-height:1.7;color:#5c5e62;white-space:pre-wrap;">${escHtml(data.inquiry)}</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f5f5;padding:20px 40px;border-top:1px solid #efefef;">
            <p style="margin:0;font-size:12px;color:#8c8f94;">
              Received on ${timestamp} (CET) · ${COMPANY_LEGAL_NAME}, ${COMPANY_ADDRESS_STREET}, ${COMPANY_ADDRESS_CITY}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    warnRateLimit("/api/contact", "POST", ip, req.headers.get("user-agent") ?? "");
    return rateLimitResponse(retryAfter(`contact:${ip}`));
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[/api/contact] RESEND_API_KEY is not set");
    return NextResponse.json(
      { error: `Email service is not configured. Please contact us directly at ${COMPANY_EMAIL}.` },
      { status: 503 }
    );
  }

  const settings = await getSiteSettings();
  const CONTACT_EMAIL = settings.contact_email || process.env.CONTACT_EMAIL || COMPANY_EMAIL;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = validate(body);
  if (!data) {
    return NextResponse.json({ error: "Required fields are missing or invalid." }, { status: 422 });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [CONTACT_EMAIL],
      replyTo: data.email,
      subject: `Contact Inquiry: ${data.subject} — from ${data.name}`,
      html: buildHtml(data),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/contact] Resend error:", err);
    return NextResponse.json(
      { error: "Failed to send your message. Please try again or contact us directly." },
      { status: 500 }
    );
  }
}
