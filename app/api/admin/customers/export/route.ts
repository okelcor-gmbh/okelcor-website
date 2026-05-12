/**
 * /api/admin/customers/export
 * GET → streams a CSV of all customers through paginated backend calls.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;
const PER  = 200;

type Row = {
  id: number; first_name: string; last_name: string; email: string;
  customer_type: string; company_name?: string; country?: string; phone?: string;
  status?: string; last_login_at?: string; created_at: string; source?: string;
};

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") ?? "";

  const headers = ["ID","First Name","Last Name","Email","Type","Company","Country","Phone","Status","Last Login","Joined","Source"];
  const rows: string[] = [headers.join(",")];

  let page = 1;
  let fetched = 0;
  let totalPages = 1;

  try {
    do {
      const url = new URL(`${BASE}/customers`);
      url.searchParams.set("per_page", String(PER));
      url.searchParams.set("page", String(page));
      if (status) url.searchParams.set("status", status);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) break;
      const json = await res.json().catch(() => null);
      if (!json) break;

      const data: Row[] = Array.isArray(json.data) ? json.data : [];
      totalPages = json.meta?.last_page ?? 1;
      fetched += data.length;

      for (const r of data) {
        rows.push([
          r.id, r.first_name, r.last_name, r.email, r.customer_type,
          r.company_name ?? "", r.country ?? "", r.phone ?? "",
          r.status ?? "active", r.last_login_at ?? "", r.created_at, r.source ?? "",
        ].map(csvEscape).join(","));
      }
      page++;
    } while (page <= totalPages && rows.length < 10001);
  } catch { /* fall through — return whatever was collected */ }

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${today}.csv"`,
    },
  });
}
