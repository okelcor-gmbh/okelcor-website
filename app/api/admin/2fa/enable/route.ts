import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const adminToken  = request.cookies.get("admin_token")?.value;
  const setupToken  = request.cookies.get("admin_setup_token")?.value;

  if (!adminToken && !setupToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    let res: Response;

    if (adminToken) {
      // Normal authenticated flow — admin is already logged in and enabling 2FA voluntarily
      res = await fetch(`${API_URL}/admin/2fa/enable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: await request.text(),
        cache: "no-store",
      });
    } else {
      // Mandatory setup flow — temp token passed in request body, not as Bearer
      res = await fetch(`${API_URL}/admin/2fa/setup/enable`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ temp_token: setupToken }),
        cache: "no-store",
      });
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        typeof json.message === "string"
          ? json.message
          : "Could not start 2FA setup. Please sign in again.";
      return NextResponse.json({ message: msg }, { status: res.status });
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
