import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  COMPANY_LEGAL_NAME,
  COMPANY_ADDRESS_STREET,
  COMPANY_ADDRESS_CITY,
  SITE_URL,
} from "@/lib/constants";
import { rateLimit, retryAfter, getClientIp, rateLimitResponse, warnRateLimit } from "@/lib/rate-limit";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

const FROM_EMAIL = process.env.FROM_EMAIL || "Okelcor <noreply@okelcor.com>";

// ── Email helpers ──────────────────────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildVerifyHtml(firstName: string): string {
  const name = esc(firstName || "there");
  const loginLink = `${SITE_URL}/login`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr>
    <td style="background:#171a20;padding:36px 40px 28px;">
      <div style="display:inline-block;width:36px;height:4px;background:#f4511e;border-radius:2px;margin-bottom:18px;"></div>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;">Welcome to Okelcor</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.55);font-size:14px;">Your account has been created</p>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 40px 28px;">
      <p style="margin:0 0 18px;font-size:16px;font-weight:600;color:#171a20;">Hi ${name},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#5c5e62;">
        Your Okelcor account has been created successfully. We have sent you a separate email
        containing a verification link — click that link to activate your account and gain
        full access.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#5c5e62;">
        Once verified, you can sign in using the email address and password you chose during registration.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
        <tr>
          <td style="border:1px solid rgba(0,0,0,0.1);border-radius:100px;padding:0;">
            <a href="${loginLink}" style="display:inline-block;padding:13px 32px;color:#171a20;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.01em;">
              Go to Login →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f5f5f5;padding:20px 40px;border-top:1px solid #efefef;">
      <p style="margin:0;font-size:12px;color:#8c8f94;">
        ${esc(COMPANY_LEGAL_NAME)} &middot; ${esc(COMPANY_ADDRESS_STREET)} &middot; ${esc(COMPANY_ADDRESS_CITY)}
      </p>
      <p style="margin:6px 0 0;font-size:12px;color:#8c8f94;">
        You received this email because you registered an account on okelcor.com.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildVerifyText(firstName: string): string {
  return `Hi ${firstName || "there"},

Your Okelcor account has been created successfully.

We have sent you a separate email containing a verification link. Click that link to activate your account.

Once verified, sign in at: ${SITE_URL}/login

${COMPANY_LEGAL_NAME} · ${COMPANY_ADDRESS_STREET} · ${COMPANY_ADDRESS_CITY}
You received this email because you registered an account on okelcor.com.
`;
}

async function sendWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !email) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const toName = [firstName, lastName].filter(Boolean).join(" ");
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [toName ? `${toName} <${email}>` : email],
      subject: "Verify your Okelcor account",
      html: buildVerifyHtml(firstName),
      text: buildVerifyText(firstName),
    });
  } catch (err) {
    console.error("[register] Resend fallback email failed:", err);
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    warnRateLimit("/api/auth/customer/register", "POST", ip, request.headers.get("user-agent") ?? "");
    return rateLimitResponse(retryAfter(`register:${ip}`));
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  let res: Response;
  let data: Record<string, unknown> = {};

  try {
    res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    data = (await res.json().catch(() => {})) as Record<string, unknown> ?? {};
  } catch {
    return NextResponse.json(
      { message: "Could not reach the server. Please try again." },
      { status: 503 }
    );
  }

  // 4xx — validation error, duplicate email, etc. — pass through unchanged
  if (res.status >= 400 && res.status < 500) {
    return NextResponse.json(data, { status: res.status });
  }

  // 2xx or 5xx — account was created; always send Resend email since Laravel's
  // mail service is unreliable (broken queue returns 2xx with no email sent)
  await sendWelcomeEmail(
    (body.email as string) ?? "",
    (body.first_name as string) ?? "",
    (body.last_name as string) ?? ""
  );

  return NextResponse.json(
    res.ok ? data : { message: "Account created. Check your email to activate your account." },
    { status: res.ok ? res.status : 201 }
  );
}
