# Backend Note — Order Currency (EUR / USD)

Triggered by a real case: a manually-entered order was paid in USD, but every
order in the system was implicitly assumed to be EUR (hardcoded `€` in the
admin UI, no `currency` field on the order model at all).

## Frontend — done

- `AdminOrder.currency` added (`lib/admin-api.ts`) — optional `string | null`,
  treated as `"EUR"` wherever absent so existing orders render unchanged.
- Order edit tab (`components/admin/order-detail.tsx`, "Order Status &
  Shipment" panel) gets a **Currency** dropdown — `EUR` / `USD` — next to
  Carrier/Tracking. Saving sends `currency` through the existing
  `PATCH /admin/orders/{id}/status` call (same place `carrier`,
  `tracking_number`, etc. already ride along).
- All money display on the order detail page, the orders list table, and the
  Payment Milestones card (deposit/balance amounts + confirmation dialogs) now
  formats using the order's `currency` instead of a hardcoded EUR symbol
  (`lib/currency.ts` — `formatMoney`).
- This is a **relabel, not a conversion** — no exchange-rate math anywhere.
  Setting an order to USD does not change any stored numbers, it just changes
  which symbol/code they're displayed with (matches the real case: the figure
  entered was already the USD amount the customer paid).

## Needed from backend

1. Add a `currency` column to `orders` (`varchar`, default `'EUR'`).
2. Accept and persist an optional `currency` field on
   `PATCH /admin/orders/{id}/status` (same endpoint already accepts
   `carrier`, `carrier_type`, `tracking_number`, `estimated_delivery`, `eta`).
3. Return `currency` on both `GET /admin/orders` (list) and
   `GET /admin/orders/{id}` (detail) responses — no other response shape
   changes needed, the frontend types already treat it as optional.
4. Not required for this pass, flagging for awareness: any backend-generated
   PDF (Proforma, Commercial Invoice, Packing List, etc.) and the payment
   milestone e-mails still hardcode `€`/EUR at generation time. If a USD order
   ever needs a document/e-mail issued, those will need the same relabel on
   the backend side — happy to scope that separately once it's actually
   needed.
