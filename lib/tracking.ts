/**
 * Carrier-based shipment tracking (GLS / DHL / ocean freight incl. Maersk) —
 * shared types. Okelco's own-fleet GPS tracking (Traccar) was removed
 * backend-side; `mode` is always "carrier" now.
 *
 * Contract: docs/FRONTEND_NOTE_tracking.md (backend). All browser calls go
 * through the Next.js proxy with the bearer.
 */

export type TrackingUnavailableReason =
  | "no_device" | "not_shipped" | "order_cancelled" | "unavailable" | string;

export type CarrierShipmentStage = "preparing" | "in_transit" | "delivered" | string;

export type CarrierShipmentEvent = {
  event_date?: string | null;
  time?: string | null;
  location?: string | null;
  status_label: string;
  description?: string | null;
};

/** Customer delivery-tracking payload (lean; always HTTP 200). Status-aware. */
export type CustomerTracking =
  | { available: false; reason?: TrackingUnavailableReason }
  | {
      available: true;
      mode: "carrier";
      order_ref: string;
      order_status?: string | null;
      delivered?: boolean;
      carrier: string;
      tracking_number: string;
      stage: CarrierShipmentStage;
      /** Deep link to the carrier's own public tracking page (GLS/DHL/Maersk). Null if unrecognized. */
      tracking_url?: string | null;
      events: CarrierShipmentEvent[];
    };
