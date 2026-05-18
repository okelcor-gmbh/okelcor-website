import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

const API_URL =
  process.env.API_URL ??
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token =
    request.cookies.get("admin_token")?.value ??
    request.cookies.get("admin_setup_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/admin/2fa/enable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: await request.text(),
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(json, { status: res.status });
    }

    // Backend returns secret + otpauth URI (or qr_url).
    // Generate QR code server-side so the secret is never exposed as a plain URL.
    const otpauthUri: string =
      json.data?.otpauth_uri ?? json.data?.qr_url ?? "";

    let qrDataUrl = "";
    if (otpauthUri) {
      qrDataUrl = await QRCode.toDataURL(otpauthUri, {
        width: 256,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }

    return NextResponse.json({
      data: {
        qr_data_url: qrDataUrl,
        manual_entry: json.data?.secret ?? json.data?.manual_entry ?? "",
        secret: json.data?.secret ?? "",
      },
    });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
