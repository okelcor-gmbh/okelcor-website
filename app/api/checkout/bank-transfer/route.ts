import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

/**
 * Proxies a bank-transfer order creation to the Laravel backend.
 * Sends the same payload as stripe-session but with payment_method: "bank_transfer".
 * Expects the backend to return { data: { order_ref: string } } without a checkout_url.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const customerToken = cookieStore.get("customer_token")?.value;

  let bodyObj: unknown;
  try {
    bodyObj = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const body = JSON.stringify(bodyObj);
  const targetUrl = `${API_URL}/payments/create-session`;
  console.log("[bank-transfer] target URL  :", targetUrl);
  console.log("[bank-transfer] request body:", body.slice(0, 400));

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
      },
      body,
      cache: "no-store",
    });

    const text = await res.text();
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(text); } catch { /* non-JSON */ }
    const responseData = (parsed?.data ?? {}) as Record<string, unknown>;
    console.log("[bank-transfer] HTTP status   :", res.status);
    console.log("[bank-transfer] has order_ref :", !!responseData.order_ref);
    console.log("[bank-transfer] raw response  :", text.slice(0, 400));

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the order service." }, { status: 502 });
  }
}
