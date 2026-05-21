import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getMollieClient } from "@/lib/mollie";
import { SITE_URL, COMPANY_NAME, COMPANY_EMAIL, COMPANY_NOREPLY_EMAIL } from "@/lib/constants";

/**
 * LEGACY/INACTIVE: Mollie webhook handling is retained for prior payments
 * only. Stripe Checkout is the active gateway for new checkout sessions.
 */
const API_URL        = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const WEBHOOK_SECRET = process.env.MOLLIE_WEBHOOK_SECRET ?? "";

const resend     = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || `${COMPANY_NAME} <${COMPANY_NOREPLY_EMAIL}>`;

// ── Customer confirmation email ───────────────────────────────────────────────

function buildCustomerEmail(orderRef: string, amount: string, method: string): string {
  const trackUrl = `${SITE_URL}/account/orders`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#171a20">
      <!-- Header -->
      <div style="background:#171a20;padding:28px 32px;border-radius:14px 14px 0 0">
        <div style="display:inline-block;width:24px;height:3px;background:#E85C1A;border-radius:2px;margin-bottom:14px"></div>
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.01em">
          Payment Confirmed
        </h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:13px">
          Your order is being prepared for dispatch.
        </p>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 14px 14px">

        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5c5e62">
          Thank you for your order. We have received your payment and your order is now confirmed.
        </p>

        <!-- Order summary box -->
        <div style="background:#f5f5f5;border-radius:10px;padding:18px 20px;margin-bottom:24px">
          <table style="width:100%;font-size:13px;color:#171a20;border-collapse:collapse">
            <tr>
              <td style="padding:5px 0;color:#5c5e62">Order Reference</td>
              <td style="padding:5px 0;text-align:right;font-weight:700;font-family:monospace;font-size:14px">${orderRef}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#5c5e62">Amount Paid</td>
              <td style="padding:5px 0;text-align:right;font-weight:700;color:#166534">€${amount}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#5c5e62">Payment Method</td>
              <td style="padding:5px 0;text-align:right;text-transform:capitalize">${method}</td>
            </tr>
          </table>
        </div>

        <!-- What happens next -->
        <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#171a20;text-transform:uppercase;letter-spacing:0.08em">
          What happens next
        </h2>
        <ol style="margin:0 0 24px;padding-left:18px;font-size:14px;line-height:1.8;color:#5c5e62">
          <li>Our team will review and process your order</li>
          <li>You will receive a shipping confirmation once dispatched</li>
          <li>Track your order anytime using the link below</li>
        </ol>

        <!-- Track order CTA -->
        <div style="text-align:center;margin-bottom:24px">
          <a
            href="${trackUrl}"
            style="display:inline-block;background:#E85C1A;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:999px;font-size:14px;font-weight:700"
          >
            Track Your Order →
          </a>
        </div>

        <!-- Contact -->
        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
          Questions? Contact us at
          <a href="mailto:${COMPANY_EMAIL}" style="color:#E85C1A;text-decoration:none">${COMPANY_EMAIL}</a>
        </p>
      </div>
    </div>
  `;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // If MOLLIE_WEBHOOK_SECRET is set, the webhook URL must include ?secret=<value>
  if (WEBHOOK_SECRET) {
    const incomingSecret = request.nextUrl.searchParams.get("secret");
    if (incomingSecret !== WEBHOOK_SECRET) {
      console.warn("[Mollie webhook] Invalid or missing secret — request ignored");
      return NextResponse.json({ received: true });
    }
  }

  // Mollie sends form-encoded body with "id" field
  let paymentId: string | null = null;
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    paymentId = params.get("id");
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment id." }, { status: 400 });
  }

  // Fetch the payment from Mollie to verify status
  let payment;
  try {
    payment = await getMollieClient().payments.get(paymentId);
  } catch {
    return NextResponse.json({ error: "Could not fetch payment." }, { status: 502 });
  }

  const meta          = payment.metadata as Record<string, string> | null;
  const orderRef      = meta?.orderRef ?? "";
  const customerEmail = meta?.customerEmail ?? "";
  const status        = payment.status; // 'paid' | 'failed' | 'expired' | 'canceled' | 'pending' | 'open'
  const amountValue   = payment.amount?.value ?? "0.00";
  const method        = payment.method ?? "card";

  // ── 1. Notify backend to update order status ─────────────────────────────────
  if (orderRef) {
    try {
      await fetch(`${API_URL}/orders/mollie-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(WEBHOOK_SECRET ? { "X-Webhook-Secret": WEBHOOK_SECRET } : {}),
        },
        body: JSON.stringify({ paymentId, orderRef, status }),
        cache: "no-store",
      });
    } catch {
      console.error("[Mollie webhook] Failed to notify backend for order", orderRef);
    }
  }

  // ── 2. Send customer confirmation email only on successful payment ────────────
  if (status === "paid" && customerEmail && process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      [customerEmail],
        subject: `Order Confirmed — ${orderRef}`,
        html:    buildCustomerEmail(orderRef, amountValue, method),
      });
    } catch (emailErr) {
      console.error("[Mollie webhook] Customer email failed:", emailErr);
    }
  }

  // Always return 200 so Mollie doesn't keep retrying
  return NextResponse.json({ received: true });
}
