import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { COMPANY_NAME, COMPANY_LEGAL_NAME, COMPANY_EMAIL, COMPANY_NOREPLY_EMAIL, COMPANY_PHONE, COMPANY_ADDRESS_STREET, COMPANY_ADDRESS_CITY, COMPANY_ADDRESS_COUNTRY } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site-settings";
import { rateLimit, retryAfter, getClientIp, rateLimitResponse, warnRateLimit } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || `${COMPANY_NAME} Website <${COMPANY_NOREPLY_EMAIL}>`;

// ─── Types ─────────────────────────────────────────────────────────────────────

type QuoteData = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  businessType: string;
  tyreCategory: string;
  brandPreference: string;
  tyreSize: string;
  quantity: string;
  budgetRange: string;
  deliveryLocation: string;
  deliveryTimeline: string;
  notes: string;
};

// ─── Server-side validation ────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof QuoteData)[] = [
  "fullName", "email", "country", "tyreCategory",
  "quantity", "deliveryLocation", "notes",
];

function validate(body: unknown): QuoteData | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const data: QuoteData = {
    fullName: typeof b.fullName === "string" ? b.fullName.trim() : "",
    companyName: typeof b.companyName === "string" ? b.companyName.trim() : "",
    email: typeof b.email === "string" ? b.email.trim() : "",
    phone: typeof b.phone === "string" ? b.phone.trim() : "",
    country: typeof b.country === "string" ? b.country.trim() : "",
    businessType: typeof b.businessType === "string" ? b.businessType.trim() : "",
    tyreCategory: typeof b.tyreCategory === "string" ? b.tyreCategory.trim() : "",
    brandPreference: typeof b.brandPreference === "string" ? b.brandPreference.trim() : "",
    tyreSize: typeof b.tyreSize === "string" ? b.tyreSize.trim() : "",
    quantity: typeof b.quantity === "string" ? b.quantity.trim() : "",
    budgetRange: typeof b.budgetRange === "string" ? b.budgetRange.trim() : "",
    deliveryLocation: typeof b.deliveryLocation === "string" ? b.deliveryLocation.trim() : "",
    deliveryTimeline: typeof b.deliveryTimeline === "string" ? b.deliveryTimeline.trim() : "",
    notes: typeof b.notes === "string" ? b.notes.trim() : "",
  };

  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return null;

  return data;
}

// ─── Reference number ──────────────────────────────────────────────────────────

function generateRef(): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `OKL-QR-${ts}-${rand}`;
}

// ─── HTML helpers ──────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:10px 16px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#8c8f94;white-space:nowrap;width:180px;vertical-align:top;">
        ${escHtml(label)}
      </td>
      <td style="padding:10px 16px;font-size:14px;color:#171a20;vertical-align:top;">
        ${escHtml(value)}
      </td>
    </tr>`;
}

function sectionHeader(title: string): string {
  return `
    <tr>
      <td colspan="2" style="padding:20px 16px 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#f4511e;border-top:1px solid #f0f0f0;">
        ${escHtml(title)}
      </td>
    </tr>`;
}

// ─── Email templates ───────────────────────────────────────────────────────────

function buildInternalHtml(data: QuoteData, refNumber: string): string {
  const timestamp = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/Berlin",
    dateStyle: "full",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#171a20;padding:32px 40px;">
            <div style="display:inline-block;width:28px;height:4px;background:#f4511e;border-radius:2px;margin-bottom:16px;"></div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">
              New Quote Request
            </h1>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.55);">
              Reference: <strong style="color:#f4511e;">${escHtml(refNumber)}</strong>
              &nbsp;·&nbsp;${timestamp} CET
            </p>
          </td>
        </tr>

        <!-- Fields -->
        <tr>
          <td style="padding:8px 24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">

              ${sectionHeader("Business / Customer Information")}
              ${row("Full Name", data.fullName)}
              ${row("Company", data.companyName)}
              ${row("Email", data.email)}
              ${row("Phone", data.phone)}
              ${row("Country", data.country)}
              ${row("Business Type", data.businessType)}

              ${sectionHeader("Product Request")}
              ${row("Tyre Category", data.tyreCategory)}
              ${row("Brand Preference", data.brandPreference)}
              ${row("Tyre Size / Spec", data.tyreSize)}
              ${row("Quantity", data.quantity)}
              ${row("Budget Range", data.budgetRange)}

              ${sectionHeader("Logistics")}
              ${row("Delivery Location", data.deliveryLocation)}
              ${row("Delivery Timeline", data.deliveryTimeline)}

              ${sectionHeader("Notes / Requirements")}
              <tr>
                <td colspan="2" style="padding:10px 16px;">
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#5c5e62;white-space:pre-wrap;">${escHtml(data.notes)}</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f5f5;padding:20px 40px;border-top:1px solid #efefef;">
            <p style="margin:0;font-size:12px;color:#8c8f94;">
              Reply directly to this email to respond to <a href="mailto:${escHtml(data.email)}" style="color:#f4511e;">${escHtml(data.email)}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildConfirmationHtml(data: QuoteData, refNumber: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#171a20;padding:36px 40px;text-align:center;">
            <div style="display:inline-block;width:28px;height:4px;background:#f4511e;border-radius:2px;margin-bottom:20px;"></div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">
              Quote Request Received
            </h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.60);font-size:14px;">
              Thank you, ${escHtml(data.fullName.split(" ")[0])}.
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#5c5e62;">
              We have received your quote request for <strong style="color:#171a20;">${escHtml(data.tyreCategory)}</strong>
              ${data.quantity ? ` (${escHtml(data.quantity)})` : ""}
              and our sales team will review your requirements and get back to you
              with a tailored quotation within <strong style="color:#171a20;">one business day</strong>.
            </p>

            <!-- Reference box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;text-align:center;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#8c8f94;">
                    Your Reference Number
                  </p>
                  <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.06em;color:#171a20;">
                    ${escHtml(refNumber)}
                  </p>
                  <p style="margin:6px 0 0;font-size:12px;color:#8c8f94;">
                    Please quote this reference in any follow-up communications.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 6px;font-size:13px;color:#5c5e62;">
              If you have any urgent questions, please contact us directly:
            </p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#171a20;">
              <a href="mailto:${COMPANY_EMAIL}" style="color:#f4511e;text-decoration:none;">${COMPANY_EMAIL}</a>
              &nbsp;·&nbsp; ${COMPANY_PHONE}
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f5f5;padding:20px 40px;border-top:1px solid #efefef;text-align:center;">
            <p style="margin:0;font-size:12px;color:#8c8f94;">
              ${COMPANY_LEGAL_NAME} · ${COMPANY_ADDRESS_STREET} · ${COMPANY_ADDRESS_CITY}, ${COMPANY_ADDRESS_COUNTRY}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`quote:${ip}`, 5, 60 * 60 * 1000)) {
    warnRateLimit("/api/quote", "POST", ip, req.headers.get("user-agent") ?? "");
    return rateLimitResponse(retryAfter(`quote:${ip}`));
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[/api/quote] RESEND_API_KEY is not set");
    return NextResponse.json(
      { error: `Email service is not configured. Please contact us directly at ${COMPANY_EMAIL}.` },
      { status: 503 }
    );
  }

  const settings = await getSiteSettings();
  const QUOTE_EMAIL = (
    settings.quote_email ||
    settings.contact_email ||
    process.env.QUOTE_EMAIL ||
    process.env.CONTACT_EMAIL ||
    COMPANY_EMAIL
  ).replace(/@okelcor\.de\b/g, "@okelcor.com");

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

  const refNumber = generateRef();

  console.log(`[/api/quote] Sending quote ${refNumber} from ${data.email} to sales: ${QUOTE_EMAIL} (from: ${FROM_EMAIL})`);

  try {
    // Send internal notification to sales team
    const internalResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [QUOTE_EMAIL],
      replyTo: data.email,
      subject: `Quote Request ${refNumber}: ${data.tyreCategory} — ${data.fullName}, ${data.country}`,
      html: buildInternalHtml(data, refNumber),
    });
    console.log(`[/api/quote] Internal email sent — id: ${(internalResult as { id?: string })?.id ?? "unknown"}`);

    // Send confirmation to the requester
    const confirmResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      subject: `Quote Request Received — ${refNumber}`,
      html: buildConfirmationHtml(data, refNumber),
    });
    console.log(`[/api/quote] Confirmation email sent to requester — id: ${(confirmResult as { id?: string })?.id ?? "unknown"}`);

    return NextResponse.json({ success: true, refNumber });
  } catch (err) {
    console.error("[/api/quote] Resend error:", err);
    return NextResponse.json(
      { error: "Failed to submit your quote request. Please try again or contact us directly." },
      { status: 500 }
    );
  }
}
