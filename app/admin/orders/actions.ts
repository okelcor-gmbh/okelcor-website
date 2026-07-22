"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  return token;
}

type OrderStatus = "pending" | "confirmed" | "awaiting_proforma" | "processing" | "shipped" | "delivered" | "cancelled";

type ShipmentFields = {
  container_number?: string;  // legacy
  carrier?: string;
  carrier_type?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  eta?: string;
  currency?: string;
};

type ShipmentEventInput = {
  date: string;
  status_label: string;
  location?: string;
  description?: string;
};

type ShipmentEventRow = {
  id: number;
  event_date?: string | null;
  status_label: string;
  location?: string | null;
  description?: string | null;
};

type LaravelErrorResponse = { message?: string; errors?: Record<string, string[]> };

function toISODate(raw: string): string {
  if (!raw) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;           // already YYYY-MM-DD
  const dd = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dd) return `${dd[3]}-${dd[2]}-${dd[1]}`;               // DD/MM/YYYY → YYYY-MM-DD
  try { return new Date(raw).toISOString().slice(0, 10); } catch { return raw; }
}

function extractApiError(json: LaravelErrorResponse, fallback: string): string {
  if (json.errors) {
    const first = Object.values(json.errors)[0];
    if (first?.[0]) return first[0];
  }
  return json.message || fallback;
}

function buildEventBody(data: ShipmentEventInput): string {
  return JSON.stringify({
    event_date:   toISODate(data.date),
    status_label: data.status_label,
    location:     data.location    || undefined,
    description:  data.description || undefined,
  });
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  shipment?: ShipmentFields
): Promise<{ error?: string }> {
  const token = await getToken();

  const body: Record<string, string> = { status };
  if (shipment?.container_number?.trim())  body.container_number  = shipment.container_number.trim();
  if (shipment?.carrier?.trim())           body.carrier           = shipment.carrier.trim();
  if (shipment?.carrier_type?.trim())      body.carrier_type      = shipment.carrier_type.trim();
  if (shipment?.tracking_number?.trim())   body.tracking_number   = shipment.tracking_number.trim();
  if (shipment?.estimated_delivery)        body.estimated_delivery = shipment.estimated_delivery;
  if (shipment?.eta)                       body.eta               = shipment.eta;
  if (shipment?.currency?.trim())          body.currency          = shipment.currency.trim();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || `Failed to update order (HTTP ${res.status}).` };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return {};
}

export async function cancelOrder(id: number): Promise<{ error?: string }> {
  const token = await getToken();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: (json as { message?: string }).message || `Failed to cancel order (HTTP ${res.status}).` };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return {};
}

export async function deleteOrder(
  id: number,
  confirmRef: string,
): Promise<{ error?: string; deleted?: boolean }> {
  const token = await getToken();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/orders/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ confirm_ref: confirmRef }),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  if (res.status === 422) {
    return { error: "Order reference does not match. Please check and try again." };
  }
  if (res.status === 409) {
    return { error: "Paid orders cannot be deleted." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: (json as { message?: string }).message || `Failed to delete order (HTTP ${res.status}).` };
  }

  revalidatePath("/admin/orders");
  return { deleted: true };
}

export async function addShipmentEvent(
  orderId: number,
  data: ShipmentEventInput,
): Promise<{ event?: ShipmentEventRow; error?: string }> {
  const token = await getToken();
  try {
    const res = await fetch(`${API_URL}/admin/orders/${orderId}/shipment-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: buildEventBody(data),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({})) as LaravelErrorResponse & { data?: ShipmentEventRow };
    if (!res.ok) return { error: extractApiError(json, `Failed to add event (HTTP ${res.status}).`) };
    revalidatePath(`/admin/orders/${orderId}`);
    return { event: json.data };
  } catch {
    return { error: "Network error. Could not reach the server." };
  }
}

export async function updateShipmentEvent(
  orderId: number,
  eventId: number,
  data: ShipmentEventInput,
): Promise<{ error?: string }> {
  const token = await getToken();
  try {
    const res = await fetch(`${API_URL}/admin/orders/${orderId}/shipment-events/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: buildEventBody(data),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({})) as LaravelErrorResponse;
    if (!res.ok) return { error: extractApiError(json, `Failed to update event (HTTP ${res.status}).`) };
    revalidatePath(`/admin/orders/${orderId}`);
    return {};
  } catch {
    return { error: "Network error. Could not reach the server." };
  }
}

export async function deleteShipmentEvent(
  orderId: number,
  eventId: number,
): Promise<{ error?: string }> {
  const token = await getToken();
  try {
    const res = await fetch(`${API_URL}/admin/orders/${orderId}/shipment-events/${eventId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({})) as { message?: string };
    if (!res.ok) return { error: json.message || `Failed to delete event (HTTP ${res.status}).` };
    revalidatePath(`/admin/orders/${orderId}`);
    return {};
  } catch {
    return { error: "Network error. Could not reach the server." };
  }
}
