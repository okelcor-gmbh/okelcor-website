import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const res = await fetch(`${API_URL}/admin/articles/${id}/body-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Upload failed." }, { status: 500 });
  }
}
