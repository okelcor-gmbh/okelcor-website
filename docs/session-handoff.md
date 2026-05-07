# Session Handoff

## Project Summary

This project builds the **Okelco corporate website**.

Okelco is a **global tyre sourcing and supply company** specializing in:

* Used tyres
* PCR tyres
* TBR tyres
* Logistics tyre supply
* Wholesale tyre distribution
* **Fuel Echo Tech** (fuel efficiency device — second product line, previously called "FET Engine Treatment")

The design system follows a **Tesla-inspired layout structure**, adapted to the tyre industry.
The backend is a Laravel API at `https://api.okelcor.de/api/v1` — fully live.

---

## Technology Stack

* Next.js (App Router)
* React 19 / TypeScript 5
* Tailwind CSS v4
* GSAP 3.14 + @gsap/react 2.1 (sole animation library — Framer Motion fully removed)
* **Custom cookie-based customer auth** — `customer_token` httpOnly cookie, proxied Laravel API (NextAuth fully removed)
* Resend (email API — contact and checkout order notification routes; **no longer used for quote requests** — backend owns those emails)
* `tailwind-merge`, `clsx`, `eslint-plugin-jsx-a11y`, `prettier`

Development environment: Windows 11, VS Code, Node.js / npm

---

## Brand Colors (Authoritative)

### Okelcor Main Site
| Token | Value | CSS Variable |
|---|---|---|
| Okelco Orange | `#f4511e` | `--primary` |
| Orange Hover | `#df4618` | `--primary-hover` |
| Text Primary | `#171a20` | `--foreground` |
| Text Secondary | `#5c5e62` | `--muted` |
| Surface Grey | `#efefef` | — |
| Page Background | `#f5f5f5` | — |

### Fuel Echo Tech Page (`/fet`) — separate design system
| Role | Value |
|---|---|
| Page background | `#f0f4f0` |
| Cards | `white`, border `#e2e8e2` |
| Text primary | `#111111` |
| Text secondary | `#6b7280` |
| Accent / buttons | `#22c55e` (bright green) |
| Badge bg | `#dcfce7`, text `#166534` |
| Results section bg | `#0d2b1a` (dark green) — white text |
| CTA hover | `#16a34a` |

**Rule:** The Fuel Echo Tech page uses its own green-based palette. Never apply `var(--primary)` (orange) to FET-specific UI.

---

## Completed in Latest Session — Phase 2B-2: EU Entry Certificate Visibility (2026-05-07)

### Phase 2B-2 — EU Entry Certificate Visibility Foundation

**Goal:** Surface the Gelangensbestätigung (EU Entry Certificate, §17a UStDV) declaration status to both customers and admins, and provide a dedicated admin list + detail view.

**Background:** For intra-community B2B zero-VAT supplies (reverse charge), German law requires the supplier to hold a signed entry confirmation from the buyer. Backend now exposes declaration fields on orders.

#### Updated: `lib/admin-api.ts`
Added four optional fields to `AdminOrderFull`:
```typescript
declaration_required?: boolean | null;
declaration_status?: "pending" | "signed" | "acknowledged" | null;
declaration_id?: number | null;
declaration_signed_at?: string | null;
```

#### Updated: `app/account/orders/page.tsx`
Added three declaration fields to the exported `Order` type:
```typescript
declaration_required?: boolean | null;
declaration_status?: "pending" | "signed" | "acknowledged" | null;
declaration_signed_at?: string | null;
```

#### Updated: `app/account/orders/[ref]/page.tsx`
EU Entry Certificate card inserted between payment card and status timeline.

- Only rendered when `order.declaration_required === true`
- **Pending (amber):** "Action required: EU Entry Certificate (Gelangensbestätigung)" + explanation of §17a UStDV obligation
- **Signed (green):** "Signed — awaiting acknowledgement from Okelcor" + signed date if present
- **Acknowledged (green):** "Confirmed — Okelcor has acknowledged receipt of your signed declaration"
- Imports `FileCheck` from lucide-react

#### Updated: `components/admin/order-detail.tsx`
EU Entry Certificate card added after the two-column customer/order summary section, before Order Items.

- Visible when `order.declaration_required != null`
- Shows: Required (Yes/No), Status badge (amber/blue/emerald), Declaration ID (always shown; clickable link to `/admin/eu-declarations/{id}` or `—` when null), Signed At (always shown; `—` when null)

#### New: `app/admin/eu-declarations/page.tsx`
List page at `/admin/eu-declarations`. Fetches `GET /admin/eu-declarations`.

Columns: Order Ref (linked to order detail), Customer / Company, Email, Country, VAT Number, Status badge, Signed, Created, View button.

- `EuDeclaration` type defined locally with all fields including `email`
- Status badges: amber (pending), blue (signed), emerald (acknowledged)
- View button links to `/admin/eu-declarations/{id}`
- Handles `AdminUnauthorizedError` → redirect to `/admin/login`; `AdminForbiddenError` → redirect to `/admin/unauthorized`

#### New: `app/admin/eu-declarations/[id]/page.tsx`
Detail page at `/admin/eu-declarations/{id}`. Fetches `GET /admin/eu-declarations/{id}`.

- **Status banner** at top: colour-coded (amber/blue/green) with human-readable description
- **Order & Customer card**: Order Ref (linked), Customer, Company, Email, Country, VAT Number
- **Declaration Details card**: Created, Signed At, Updated; optional "Download / View Document" link when `signed_document_url` is present
- **Notes section** (conditional): Customer Notes + Internal Admin Notes (amber block)
- Handles 404 (`notFound()`), 401, 403 gracefully
- Back link to `/admin/eu-declarations`

#### Updated: `components/admin/admin-shell.tsx`
- Added `FileCheck` to lucide-react imports
- Added `{ label: "EU Declarations", href: "/admin/eu-declarations", icon: FileCheck, section: "eu_declarations" }` to `NAV` immediately after "Quote Requests"

#### Updated: `lib/admin-permissions.ts`
- Added `eu_declarations` to `super_admin`, `admin`, and `order_manager` access lists
- Added `"/admin/eu-declarations": "eu_declarations"` to `PATH_SECTION`
- `editor` role does **not** have access

---

## Completed in Latest Session — Phase 2A: EU VAT Enforcement & RFQ Form Upgrade (2026-05-07)

### Phase 2A-1 — Mandatory EU VAT Workflow for B2B Customers

**Goal:** EU business customers outside Germany must validate their VAT number before checkout or quote submission. Germany always shows an amber note that German VAT still applies.

**Rules implemented:**
| Customer type + country | VAT field | Behaviour |
|---|---|---|
| B2B + EU outside Germany | Shown, required | Submit blocked until valid |
| B2B + Germany | Shown, optional | Amber note always shown; submit never blocked |
| B2B + non-EU | Shown, optional | No VAT constraint |
| B2C (any country) | Hidden | No VAT field |

#### New: `lib/eu-vat.ts`
Single source of truth for the EU country set and the helper function. Both checkout and quote form import from here.
```typescript
export const EU_COUNTRIES = new Set([...27 member states...]);
export function isEuCountryExceptGermany(country: string): boolean { ... }
```

#### Updated: `components/vat-field.tsx`
Added `required?: boolean` prop. When `true`, label shows an orange `*`; when `false`, shows `(optional)` muted text.

#### Updated: `components/checkout/checkout-flow.tsx`
- Removed local `EU_COUNTRIES` duplicate; imports from `@/lib/eu-vat`
- Added `vatRequired` derived value: `showVatField && isEuCountryExceptGermany(delivery.country)`
- `getVatMessage`: Germany amber note shows unconditionally (not gated on `vatValid`)
- Submit guard: if `vatRequired && !vatValid` → scroll to VAT field, block submit
- `vatError` only displayed when `vatRequired` is still true (clears on country change)
- VAT field passes `required={vatRequired}` + helper text "Required for EU intra-community business purchases."

#### Updated: `components/quote/quote-form.tsx`
Same EU VAT logic applied. `vatRequired = showVatField && isEuCountryExceptGermany(form.country)`.

---

### Phase 2A-2 — RFQ Form Upgrade

**Goal:** Upgrade the quote request form so Okelcor receives enough information to quote without follow-up calls.

#### Updated: `components/quote/quote-form.tsx` (full rewrite)

New fields and features added:

**Tyre condition toggle:**
- "New tyres" / "Used tyres" pill toggle
- When Used: shows Grade dropdown (Grade A / Grade B / Mixed) + Used Tyre Notes textarea
- `tyreCondition`, `usedTyreGrade`, `usedTyreNotes` submitted to backend

**Dynamic tyre size rows:**
- Replaced single size + quantity fields with a multi-row list
- Add row / remove row (Trash2 icon) per entry
- Submits `tyre_items: Array<{ size, quantity }>` array
- Legacy compat: also sends `tyre_size` (first row size) and `quantity` (first row qty)
- Validation: at least one row must have a size before submit

**Company/contact fields (new):**
- Contact Person (who makes the purchasing decision)
- Company Address (street), City, Postal Code

**Logistics Terms (EU-aware):**
- If country is in EU: label "Delivery Terms", options: DAP / DDP / EXW, `incoterm_type: "delivery_terms"`
- If country is outside EU: label "Shipping Terms", options: FOB / CIF / EXW, `incoterm_type: "shipping_terms"`
- Incoterm resets when customer switches between EU ↔ non-EU countries
- Submitted as `incoterm` + `incoterm_type`

**Submit paths:** Both JSON and FormData (multipart) paths include all new fields.

**Types added to `FormData`:**
`contactPerson`, `companyAddress`, `companyCity`, `companyPostalCode`, `tyreCondition`, `usedTyreGrade`, `usedTyreNotes`, `incoterm`

**Removed:** `tyreSize`, `quantity` (replaced by `tyreItems` array; legacy fallback fields still sent)

#### Updated: `lib/admin-api.ts`
14 new optional fields added to `AdminQuoteFull`:
```typescript
vat_number?, business_type?, contact_person?,
company_address?, company_city?, company_postal_code?,
tyre_condition?, used_tyre_grade?, used_tyre_notes?,
tyre_items?: Array<{ size: string; quantity: string }> | null,
delivery_timeline?, budget_range?, incoterm?, incoterm_type?
```

#### Updated: `components/admin/quote-detail.tsx`
All new Phase 2A-2 fields are now displayed:

**Requester Details card** — added:
- Contact Person, Business Type, VAT Number
- Company Address (combined street + city + postal)

**Request Details card** — added:
- Tyre Condition, Budget Range, Delivery Timeline
- Incoterm with contextual label ("Delivery Terms" / "Shipping Terms" / "Incoterm")

**New "Tyre Sizes & Quantities" card:**
- Table showing each row: #, Tyre Size, Quantity
- Only rendered when `tyre_items` has entries

**New "Used Tyre Details" card (conditional):**
- Only rendered when `tyre_condition === "Used tyres"` and grade or notes are present
- Shows Grade + multi-line Notes

TypeScript check: **0 errors** after all changes.

---

### Phase 2A-3 — Convert Quote Modal Prefill from `tyre_items`

**Goal:** Use the structured `tyre_items` array submitted with the Phase 2A-2 RFQ form to pre-populate item rows in the Convert to Order modal, reducing manual data entry for the admin.

#### Updated: `components/admin/quote-convert-modal.tsx`

- **Replaced** `buildInitialItem(quote): ItemRow` (single row) with `buildInitialItems(quote): ItemRow[]` (multiple rows)
- **Tyre items path** (when `quote.tyre_items` is a non-empty array):
  - One `ItemRow` per `tyre_items` entry
  - `name` = `"{brand || 'Quoted tyre'} {size}"` (trimmed)
  - `brand` = `quote.brand_preference ?? ""`
  - `size` = `item.size?.trim() ?? ""`
  - `quantity` = parsed integer from `item.quantity`; empty string if NaN or ≤ 0
  - `sku`, `unit_price` = `""` (admin fills in)
- **Legacy fallback** (when no `tyre_items`): single row from `quote.tyre_size` + `quote.quantity` (previous behaviour)
- `useState<ItemRow[]>` uses a lazy initializer `() => buildInitialItems(quote)` to avoid re-running on every render
- **Size validation**: per-row guard `if (!item.size.trim()) return 'Item N: tyre size is required.'`
- **Quantity check** updated: `!Number.isInteger(qty) || qty < 1`
- **Helper text banner** (blue): *"Rows are prefilled from the customer's RFQ. Please confirm product names, quantities and prices before creating the order."*

---

## Completed in Previous Session — Shipment Events, Carrier Type & Order Status (2026-05-06)

### Backend: Revert Shipment Event Field to `event_date` (2026-05-06)

**File:** `app/Http/Controllers/Admin/AdminOrderShipmentEventController.php`, `app/Http/Controllers/Admin/AdminOrderController.php`, `app/Http/Controllers/OrderController.php`

**Problem:** Backend commit `3e7e682` renamed the response field from `event_date` to `date` to fix the crash. The frontend team independently fixed the crash (commit `ed6ab25`) by updating their types to use `event_date` instead. The two fixes went in opposite directions — backend returned `date`, frontend read `event_date` → all event dates displayed as "—".

**Fix:** Backend reverted all three formatters back to returning `event_date` to match the frontend contract. Commit `50ffd1c`.

**Authoritative contract:** All three API endpoints return `event_date` (not `date`) on every `ShipmentEvent` object:
- `POST /api/v1/admin/orders/{id}/shipment-events` → `{ data: { id, event_date, ... } }`
- `GET /api/v1/admin/orders/{id}` → `data.shipment_events[].event_date`
- `GET /api/v1/orders/{ref}` → `data.shipment_events[].event_date`

---

### Crash with 2+ Shipment Events — Fixed

**Root cause:** Frontend type had `date: string` but backend always returned `event_date`. With 0–1 events `.sort()` never calls the comparator — bug invisible. With 2+ events, `a.date.localeCompare(b.date)` fires on `undefined` → `TypeError: Cannot read properties of undefined (reading 'localeCompare')`, crashing admin detail, customer detail, and customer tracking pages.

**Frontend fix (commit `ed6ab25`):**

| File | Change |
|---|---|
| `lib/admin-api.ts` | `ShipmentEvent.date: string` → `event_date?: string \| null` |
| `app/admin/orders/actions.ts` | `ShipmentEventRow.date` → `event_date?: string \| null` |
| `components/admin/order-detail.tsx` | Sort comparator, optimistic constructors, `startEdit` prefill, date display — all `ev.date` → `ev.event_date ?? ""` |
| `components/account/shipment-tracker.tsx` | Local type + sort comparator + date display updated to `ev.event_date ?? undefined` |

TypeScript check passes with zero errors.

---

### Backend: `carrier_type` Not Persisting on Order Save — Fixed

**Files:** `app/Http/Controllers/Admin/AdminOrderController.php`

**Root cause:** `carrier_type` was validated in both `update()` and `updateStatus()` but omitted from `$request->only([...])` in both methods, so it was silently dropped. Also missing from `formatOrderDetail()` and the PATCH response body, causing the admin panel to revert the select to its old value after every save.

**Fix (commit `0e8cdfa`):**
- Added `'carrier_type'` to `$request->only()` in both `update()` and `updateStatus()`
- Added `'carrier_type' => $o->carrier_type` to `formatOrderDetail()`
- Added `'carrier_type' => $order->carrier_type` to the `updateStatus()` PATCH response body
- Added `'carrier_type' => $o->carrier_type` to `OrderController::formatOrder()` (customer endpoint)

---

### Customer Order Status Timeline — `confirmed` Status Missing — Fixed

**Root cause:** Backend correctly returns `status: "confirmed"` for admin-confirmed orders. Frontend `OrderStatus` type and `STEP_ORDER` map did not include `"confirmed"`, so the timeline step lookup returned `undefined` and "Order Placed" stayed highlighted regardless of actual status.

**Frontend fix (commit `fcad9c3`):**

| File | Change |
|---|---|
| `app/account/orders/page.tsx` | Added `"confirmed"` to `OrderStatus` union type; added `confirmed: 1` to `STEP_ORDER` map |
| `app/account/orders/[ref]/page.tsx` | Updated `TIMELINE_STEPS` to include a "Confirmed" step; `processing` maps to same step index as `confirmed` |

**Final status → step mapping:**
| `order.status` | Step |
|---|---|
| `pending` | Order Placed |
| `confirmed` | Confirmed |
| `processing` | Confirmed (same step) |
| `shipped` | Shipped |
| `delivered` | Delivered |
| `cancelled` | Cancelled state |

No backend changes needed — backend was already returning the correct value.

---

### Backend: Manual Bus/Road Freight Shipment Event Tracking — Added

**Commits:** `b89dd2e` (backend)

New table `order_shipment_events` and admin CRUD endpoints to manually track bus/road freight shipments that have no external tracking API.

**New backend:**
- Migration: `order_shipment_events` table (id, order_id, order_ref, event_date, location, status_label, description, admin_user_id, timestamps)
- Migration: adds `bus` to `orders.carrier_type` enum (was: sea/air/dhl/road)
- Model: `OrderShipmentEvent` with date cast and `belongsTo(Order)`
- `Order` model: `shipmentEvents()` hasMany, ordered by event_date + created_at asc
- Controller: `AdminOrderShipmentEventController` — store / update / destroy; `syncTrackingStatus()` keeps `orders.tracking_status` in sync with latest event label
- Routes: `POST/PUT/DELETE /api/v1/admin/orders/{id}/shipment-events/{event?}`

**Customer endpoints updated:** Both `GET /api/v1/orders/{ref}` and `GET /api/v1/orders?email=` now eager-load and return `shipment_events` array.

⚠️ **Namecheap deploy required:** Run `php artisan migrate --force` — two new migrations.

---

## Completed in Previous Session — Order Payment UX & Checkout VAT Preview (2026-05-04)

### Customer Order Detail — Dynamic Payment Section

**Files:** `app/api/account/orders/[ref]/checkout/route.ts` (new), `components/account/order-payment-card.tsx` (new), `app/account/orders/[ref]/page.tsx`

Replaced the static `payment_url` link and hardcoded "Payment link sent by email" fallback with a fully dynamic client component backed by a new proxy route.

#### Proxy route (`app/api/account/orders/[ref]/checkout/route.ts`)
- `POST /api/account/orders/{ref}/checkout` reads `customer_token` cookie, forwards to `POST /api/v1/auth/orders/{ref}/checkout` with Bearer auth
- Returns `{ data: { checkout_url, checkout_session_id, order_ref } }` from Laravel unchanged

#### `OrderPaymentCard` client component (`components/account/order-payment-card.tsx`)
Renders based on `payment_status` + `payment_method`:

| State | UI |
|---|---|
| `paid` | Green "Payment Complete" block |
| `pending` + `stripe` | "Payment Required" + **"Pay securely with Stripe"** button → calls proxy → stores `stripe_order_ref` in sessionStorage → `window.location.href = checkout_url` |
| `pending` + `bank_transfer` | "Payment by Bank Transfer — Our team will share payment instructions." |
| `pending` + other/unknown | Amber clock — "Awaiting payment instructions from Okelcor." |
| `payment_status` absent | Card not rendered |

Inline errors: 401 → session expired; 409 → not awaiting payment; 422 → not Stripe order; network → retry prompt.

#### Order detail page (`app/account/orders/[ref]/page.tsx`)
- Removed: IIFE payment block, `CreditCard`, `Mail`, `ExternalLink` imports
- Added: `<OrderPaymentCard orderRef={order.ref} paymentMethod={...} paymentStatus={...} />` rendered when `order.payment_status` is defined

---

### Checkout Order Summary — Tax Label Fix

**Files:** `lib/translations.ts`, `components/checkout/order-summary.tsx`

Removed the misleading "Tax calculated on invoice" copy (incorrect since Stripe now calculates VAT before charge). Updated all 4 locales (EN/DE/FR/ES):

| Key | Before | After (EN) |
|---|---|---|
| `subtotal` | "Subtotal" | "Subtotal (net)" |
| `tax` | "Tax" | "VAT" |
| `taxNote` | "Calculated on invoice" | "VAT calculated securely before payment" |
| `taxDisclaimer` | "Excl. applicable taxes · Final amount confirmed on order" | "Final gross amount — confirmed at Stripe Checkout" |

Tax row in `order-summary.tsx` changed from `SummaryRow` (right-aligned, unsuited for text values) to a two-line stacked muted block.

---

### Checkout — Live VAT Preview from Backend

**Files:** `app/api/checkout/tax-preview/route.ts` (new), `components/checkout/order-summary.tsx`, `components/checkout/checkout-flow.tsx`, `components/vat-field.tsx`

#### Proxy route (`app/api/checkout/tax-preview/route.ts`)
- `POST /api/checkout/tax-preview` forwards to `POST /api/v1/payments/tax-preview`; attaches `customer_token` Bearer if present

#### Backend response shape
```json
{
  "data": {
    "subtotal_net": 29.40,
    "delivery_cost": 0.00,
    "tax_rate": 19.00,
    "tax_amount": 5.59,
    "tax_treatment": "standard",
    "is_reverse_charge": false,
    "total": 34.99,
    "note": null
  }
}
```

#### `VatField` (`components/vat-field.tsx`)
Added `onValidationChange?: (valid: boolean) => void` prop:
- Fires `true` when VIES validation returns valid
- Fires `false` on invalid, unavailable, and whenever the user edits the field (resetting validity)

#### `CheckoutFlow` (`components/checkout/checkout-flow.tsx`)
- Added `vatValid: boolean` state (initially `false`), driven by `VatField.onValidationChange`
- Passes 4 new props to `OrderSummary`: `country`, `vatNumber`, `vatValid`, `customerType`

#### `OrderSummary` (`components/checkout/order-summary.tsx`)
Full rewrite of the totals section:
- `vatNumber` tracked via `useRef` (synced every render) — not a `useEffect` dependency, so keystrokes do not trigger API calls
- `useEffect` triggers on: `items`, `deliveryCost`, `fetAddon`, `country`, `vatValid`, `customerType`
- 400ms debounce + `AbortController` cancel on dep change

**VAT row display:**

| Preview state | Display |
|---|---|
| `taxLoading` | `Loader2` spinner + "Calculating VAT…"; Total shows `—` |
| `tax_treatment === "standard"` | `VAT (19%): €5.59`; Total = `taxPreview.total` (gross) |
| `is_reverse_charge === true` | `VAT reverse charge (0%): €0.00` + optional `note` |
| `tax_treatment === "exempt"` | `VAT exempt (0%): €0.00` + optional `note` |
| Error / no country | Italic fallback "VAT will be confirmed at Stripe Checkout." + `taxDisclaimer` |

When preview is active: subtotal and total rows use backend values (`subtotal_net`, `total`). Disclaimer row hidden.

---

## Completed in Previous Session — Quote Email Handoff & Crisp Tier Regression (2026-05-04)

### Quote Requests Proxy — Resend Block Removed

**File:** `app/api/customer/quote-requests/route.ts`

Backend now sends **both** the admin notification email and the customer auto-reply on every successful `POST /api/v1/quote-requests`. The frontend Resend call was removed to prevent duplicate emails.

**What was removed:** `Resend` import + instance, `FROM_EMAIL`, `esc()`/`row()`/`section()`/`buildNotificationHtml()` helpers, `getSiteSettings()` call, entire Resend send block.

**What remains:** Clean proxy — receives POST (JSON or multipart), forwards to `POST /api/v1/quote-requests`, returns Laravel response unchanged.

---

### Crisp Live Chat — Tier Regression Investigation

**File:** `app/api/admin/crisp/route.ts`

**Root cause:** A prior commit changed `X-Crisp-Tier` from `"website"` to `"plugin"`. When merged to main this caused the Crisp conversations endpoint to return 404.

**Current state:**
- **main** — `X-Crisp-Tier: "website"`, env var reading: `CRISP_API_IDENTIFIER ?? CRISP_IDENTIFIER` + `CRISP_API_KEY ?? CRISP_KEY` → **working**
- **dev** — `X-Crisp-Tier: "plugin"`, env vars: `CRISP_IDENTIFIER` + `CRISP_KEY` only → **not pushed to main**

**Credentials (confirmed):**
```
CRISP_IDENTIFIER=bee0fee1-b3b0-416b-ad23-403a1c764114
CRISP_KEY=1ee43f026109e1a745a13e68525a005d59cb660cc066b55d661c619389e06da6
NEXT_PUBLIC_CRISP_WEBSITE_ID=137b074d-e431-4e79-8c69-8484dcf89fbf
```
Authorization: `Basic BASE64(CRISP_IDENTIFIER:CRISP_KEY)`

**⚠️ Unresolved:** User states the correct tier is `"plugin"` but using it on main caused 404. Must test both tiers in isolation on the live Crisp account. Do NOT merge dev version to main until confirmed.

---

## Completed in Previous Session — Pay Now CTA for Pending Stripe Orders (2026-05-04)

### Account Orders — Pay Now Button

**Files:** `app/account/orders/page.tsx`, `app/account/orders/[ref]/page.tsx`

Added a Pay Now CTA for orders where `payment_method === "stripe"` AND `payment_status === "pending"`.

#### Order list (`app/account/orders/page.tsx`)
- `Order` type gains: `payment_method?: string`, `payment_status?: string`, `payment_url?: string | null`, `checkout_url?: string | null`
- Amber **"Payment due"** badge shown in the status column alongside the order status
- CTA column: when payment is pending + URL available → orange **"Pay Now"** external link; when no URL → standard **"Track Order"** button; applies to both desktop table and mobile card layout

#### Order detail (`app/account/orders/[ref]/page.tsx`)
Payment card inserted between order header and status timeline:
- `payment_method === "stripe"` AND `payment_status === "pending"` → card renders
- If `payment_url ?? checkout_url` is present: orange **"Pay securely with Stripe"** button (external link, `target="_blank"`)
- If no URL: amber notice — *"Payment link sent by email — check your inbox"*

---

## Completed in Previous Session — Quote Form Delivery Address Fields (2026-05-04)

### Customer Quote Form — Structured Delivery Address

**Files:** `components/quote/quote-form.tsx`, `app/api/customer/quote-requests/route.ts`, `lib/translations.ts`, `lib/admin-api.ts`, `components/admin/quote-detail.tsx`, `components/admin/quote-convert-modal.tsx`

Added 3 structured address fields to the customer quote form, submitted to the backend, shown in admin, and used to prefill the Convert to Order modal.

#### Quote form (`components/quote/quote-form.tsx`)
- `FormData` gains `deliveryAddress`, `deliveryCity`, `deliveryPostalCode`
- New **"Delivery Details"** section (`sectionDelivery`) added between the timeline/budget fields and notes:
  - **Street / Delivery Address** — full-width, optional
  - **City** — half-width, optional
  - **Postal Code** — half-width, optional
  - **Preferred delivery location / port** — full-width, required (renamed from "Preferred Delivery Location"; placeholder now `"e.g. Hamburg Port, Lagos, Dubai"`)
- Both multipart (`FormData`) and JSON submit paths include `delivery_address`, `delivery_city`, `delivery_postal_code`
- `handleReset` clears the 3 new fields

#### Email notification (`app/api/customer/quote-requests/route.ts`)
- Logistics section email rows now include: Delivery Address, City, Postal Code, Delivery Location / Port (rows are empty/hidden automatically when not provided via the `row()` helper)

#### Admin types (`lib/admin-api.ts`)
- `AdminQuoteFull` gains `delivery_address?: string`, `delivery_city?: string`, `delivery_postal_code?: string`

#### Admin quote detail (`components/admin/quote-detail.tsx`)
- Request Details card now shows Delivery Address, City, Postal Code, Location / Port rows (only visible when populated)

#### Convert to Order modal (`components/admin/quote-convert-modal.tsx`)
- Delivery form prefills from quote:
  - `address` ← `quote.delivery_address ?? ""`
  - `city` ← `quote.delivery_city ?? ""`
  - `postal_code` ← `quote.delivery_postal_code ?? ""`
  - `country` ← `quote.country ?? ""` (unchanged)
  - `phone` ← `quote.phone ?? ""` (unchanged)
- Admin can edit all fields in the modal before converting

#### Translations (`lib/translations.ts`)
- Type definition gains: `sectionDelivery`, `labelDeliveryAddress`, `labelDeliveryCity`, `labelDeliveryPostalCode`, `placeholderDeliveryAddress`, `placeholderDeliveryCity`, `placeholderDeliveryPostalCode`
- All 4 locales (EN/DE/FR/ES) updated with the new keys; `labelDelivery` and `placeholderDelivery` updated to reflect the renamed field

---

## Completed in Previous Session — Admin Quote → Order Conversion UI (2026-05-04)

### Admin Quote Detail — Convert to Order

**Files:** `lib/admin-api.ts`, `app/admin/quotes/actions.ts`, `components/admin/quote-convert-modal.tsx` (new), `components/admin/quote-detail.tsx`

Implemented the full Quote → Order conversion flow in the admin panel.

#### Type changes (`lib/admin-api.ts`)
- `AdminQuote` (list type) gains `order_id?: number | null`, `order_ref?: string | null`
- `AdminQuoteFull` (detail type) gains `brand_preference?: string`, `tyre_size?: string`, `admin_notes?: string`

#### Server action (`app/admin/quotes/actions.ts`)
Added `convertQuoteToOrder(id, payload)`:
- `POST /api/v1/admin/quote-requests/{id}/convert-to-order`
- Explicit 422 handling: "Quote must be in Quoted status" message
- Explicit 409 handling: "Already converted" message
- Returns `{ data: ConvertToOrderResult }` on success — `order_ref`, `order_id` (reads `data.order_id ?? data.id`), `quote_ref`, `status`, `payment_status`, `total`
- Revalidates `/admin/quotes` and `/admin/quotes/{id}` on success
- Exported types: `ConvertOrderItem`, `ConvertToOrderPayload`, `ConvertToOrderResult`

#### Conversion modal (`components/admin/quote-convert-modal.tsx`)
New `"use client"` component with:
- **Delivery section**: address (required), city (required), postal_code (required), country (defaults to `quote.country`), phone (defaults to `quote.phone`)
- **Items section**: pre-fills one item from `quote.brand_preference` + `quote.tyre_size`; inline per-row subtotal; Add Item / Remove Item (× button) with Trash2 icon; each row: name, brand, size, sku, unit_price, quantity
- **Order Summary**: live-computed subtotal, editable delivery cost field, total
- **Payment method**: select — Bank Transfer (default), Card (Stripe), Cash
- **Admin Notes**: optional textarea
- Client-side validation before submit (required fields, price/qty > 0)
- Error display from server action (422 / 409 / network)
- Spinner + "Converting…" text while pending
- `onSuccess(result)` callback called on success; `onClose()` on cancel/overlay click

#### Quote detail integration (`components/admin/quote-detail.tsx`)
New "Order Conversion" card added below the Status card:
- **status !== "quoted"**: shows explanatory text — "set status to Quoted to enable conversion"
- **status === "quoted" and not yet converted**: shows "Convert to Order" button (ShoppingCart icon) → opens modal
- **Converted** (either `quote.order_id` from initial load or `convertedOrder` state from this session): shows green success badge "Converted to order: OKL-..."
  - "View Order" link → `/admin/orders/{order_id}` when ID is available; falls back to `/admin/orders?q={order_ref}` when only ref is known
- `convertedOrder` state set from modal `onSuccess` without requiring a page reload
- Request Details card now also shows `brand_preference` and `tyre_size` rows (these were missing before)

---

## Completed in Previous Session — Invoice Proxy, Quote UX, File Upload & Dashboard (2026-05-04)

### Invoice PDF Download — Auth Proxy

**Files:** `app/api/account/invoices/[id]/download/route.ts` (created), `app/account/invoices/page.tsx`

Direct links to `inv.pdf_url` returned 401 because the browser cannot attach the httpOnly `customer_token` cookie as a Bearer header. A Next.js proxy route was created to bridge the gap:

- Reads `customer_token` from cookies server-side
- Forwards `GET /api/v1/invoices/{id}/download` with `Authorization: Bearer` header
- Preserves `Content-Type` + `Content-Disposition` response headers
- Returns binary body via `arrayBuffer()` (not `.json()`)
- Returns 401 if cookie absent, 404/500 with JSON error if Laravel fails

`app/account/invoices/page.tsx` download link `href` changed from `inv.pdf_url` to `/api/account/invoices/${inv.id}/download`. `inv.pdf_url` is still used as a boolean gate (shows "PDF pending" pill when absent).

**Temporary debug logs** in the download route (token present, target URL, Laravel status, error body). Remove once confirmed working in production.

---

### Customer Quote Request Tracking — Full UX Overhaul

**File:** `app/account/quotes/page.tsx`

Complete rewrite of the quotes page. Key additions:

- **`NormalizedStatus`** union: `"received" | "reviewed" | "quoted" | "closed"`
- **`normalizeStatus()`** maps backend variants: `new/pending → received`, `reviewing/reviewed → reviewed`, `quoted/approved → quoted`, `closed/rejected → closed`
- **`ProgressTracker`** component: 4 orange dots connected by lines; future steps dimmed; labels below each step
- **Note blocklist + `isMeaningfulNote()`** filters out test/placeholder notes (`"test"`, `"n/a"`, `"."`, etc.)
- **`admin_notes?: string`** field on `QuoteRequest` for future Okelcor team responses
- **Quoted CTA block**: green callout + orange pill button → `/contact?quote_ref=...` shown only when `normalized === "quoted"`
- **"Your message" label** on customer notes section; separate orange-tinted `admin_notes` block labelled "Okelcor response"
- **Dynamic account type label**: `isB2B ? "B2B" : "Personal"` (removed hardcoded "B2B")

`app/account/page.tsx`: Added "Quote Requests" `DashCard` to B2C dashboard (previously only in B2B).

---

### Quote Form — File Attachment Upload

**Files:** `components/quote/quote-form.tsx`, `app/api/customer/quote-requests/route.ts`

`components/quote/quote-form.tsx`:
- Accepted formats: `.pdf`, `.csv`, `.xls`, `.xlsx` (max 10 MB)
- `attachedFile: File | null` state; hidden `<input type="file">` via `useRef`
- UI: click-to-browse area when no file; filename + size + × remove button when file attached; inline validation errors for type/size
- `handleSubmit()`: if `attachedFile` → builds `FormData` with all text fields + `attachment` file, posts without `Content-Type` (browser sets boundary); else → existing JSON path
- `handleReset()` clears file state + resets native input element

`app/api/customer/quote-requests/route.ts`:
- Detects `multipart/form-data` via `content-type` request header
- Multipart path: `request.formData()` → extracts all text fields + `attachment_name` for email; forwards `FormData` directly to Laravel (no manual `Content-Type`)
- Email template includes `Attachment` row when `attachment_name` is present
- JSON path unchanged

---

### Admin Quote Detail — Attachment Display Fix

**Files:** `lib/admin-api.ts`, `components/admin/quote-detail.tsx`, `app/admin/quotes/[id]/page.tsx`

**Problem:** Backend sends `attachment_path` + `attachment_original_name` but the type only had `attachment_url` + `attachment_name`, so the attachment card never rendered.

**Fix:**
- `AdminQuoteFull` in `lib/admin-api.ts` now has all 6 variants: `attachment_url`, `attachment_path`, `attachment_name`, `attachment_original_name`, `attachment_mime`, `attachment_size`
- `components/admin/quote-detail.tsx`: IIFE resolves `attachmentUrl = quote.attachment_url ?? quote.attachment_path ?? null` and `attachmentName = quote.attachment_original_name ?? quote.attachment_name ?? null`; render guard is `!!(attachmentUrl || attachmentName)`
- Attachment card placed **above** the Notes section
- Shows `formatBytes(size) · mime` subtitle; orange Download button (opens in new tab) when URL available; "Download unavailable" text otherwise
- `formatBytes()` helper: B / KB / MB

**Temporary debug log** in `app/admin/quotes/[id]/page.tsx` logs all 6 attachment field values to server console. Remove once confirmed.

---

### Admin Dashboard — Connected to Real Laravel Endpoint

**File:** `app/api/admin/dashboard/stats/route.ts`

Previously all KPI cards showed computed fallback values. The route now calls `GET /api/v1/admin/dashboard` in the same `Promise.all` as orders/quotes/products.

- Response handling: `db = dashboardRes?.data ?? dashboardRes ?? {}` (handles both wrapped and flat responses)
- 9 fields extracted from `db` with `null` fallbacks: `revenue_today`, `orders_today_paid`, `new_customers_today`, `conversion_rate`, `average_order_value`, `aov_period_label`, `aov_paid_orders_count`, `aov_stripe_orders_count`, `aov_manual_orders_count`
- Chart: prefers `revenue_last_7_days` array from API; handles `revenue`/`confirmed`/`amount` keys; parses ISO dates with `new Date(y, m-1, d)` constructor (avoids UTC→local shift); falls back to computed from orders
- Return object: API values take precedence, computed values are fallback
- `aovPeriodLabel`, `aovPaidOrdersCount`, `aovStripeOrdersCount`, `aovManualOrdersCount` exposed in response

`components/admin/dashboard/revenue-chart.tsx`: Added 30s `setInterval` auto-refresh (previously fired only once on mount).

---

### Admin Dashboard — AOV Card Backend Labels

**File:** `components/admin/dashboard/hero-metrics.tsx`

- `Metrics` type gains 3 new nullable fields: `aovPeriodLabel: string | null`, `aovPaidOrdersCount: number | null`, `aovManualOrdersCount: number | null`
- `refresh()` reads these from `statsRes`
- `MetricCard` component gains optional `note?: string` prop — renders as small italic light-grey text below `sub`
- AOV card `sub` prop: `"{aovPeriodLabel} · {N} paid orders"` from backend; falls back to `"confirmed orders only"` when fields are null
- AOV card `note` prop: `"includes manual/imported orders"` shown only when `aovManualOrdersCount > 0`

---

## Completed in Previous Session — Admin Order Actions, Activity Log & Invoice UX (2026-05-03)

### Admin Order Detail — Cancel & Delete Actions

**Files:** `app/admin/orders/actions.ts`, `app/admin/orders/[id]/page.tsx`, `components/admin/order-detail.tsx`

Two new server actions added to `app/admin/orders/actions.ts`:

- **`cancelOrder(id)`** — `PATCH /admin/orders/{id}/status` with `{ status: "cancelled" }`. Revalidates both list and detail paths.
- **`deleteOrder(id, confirmRef)`** — `DELETE /admin/orders/{id}` with `{ confirm_ref }`. Explicit handling: 422 → ref mismatch message, 409 → paid order cannot be deleted message. Returns `{ deleted: true }` on success.

`app/admin/orders/[id]/page.tsx` updated to read `admin_role` cookie server-side and pass it as `adminRole` prop to `OrderDetail`.

`components/admin/order-detail.tsx` updated:
- **Cancel Order button**: visible to `admin`, `order_manager`, `super_admin`; disabled when status is `cancelled` or `delivered`; on success updates local status state to `cancelled` so button self-disables
- **Delete Order button**: always rendered; disabled (with tooltip) unless `super_admin`
- **Delete confirmation modal**: input must exactly match `order.order_ref` before confirm enables; inline error display for 422/409; on success navigates to `/admin/orders`
- New state: `cancelError`, `cancelSuccess`, `isCancelPending`, `deleteModalOpen`, `deleteRef`, `deleteError`, `isDeletePending`

---

### Admin Order Detail — Activity Log

**Files:** `lib/admin-api.ts`, `components/admin/order-detail.tsx`

New type added to `lib/admin-api.ts`:
```typescript
export type AdminOrderLog = {
  id: number;
  action: string;
  old_value?: string | null;
  new_value?: string | null;
  notes?: string | null;
  admin_user_email?: string | null;
  ip_address?: string | null;
  created_at: string;
};
```
`logs?: AdminOrderLog[]` added to `AdminOrderFull`.

New `ActivityLog` + `LogEntry` components added to `order-detail.tsx`:
- Timeline with orange dot markers consistent with the container tracking widget
- `formatAction()` converts snake_case action strings to Title Case
- Old value shown as red strikethrough badge, new value as green badge
- Admin email, IP address (monospace), notes, and timestamp per entry
- Empty state: "No activity has been recorded for this order yet."
- Card placed below Order Actions, above the delete modal

---

### Invoice Discovery & UX — B2B and B2C

**Files:** `app/account/page.tsx`, `app/account/invoices/page.tsx`

`app/account/page.tsx`:
- **B2C dashboard**: added "Receipts & Invoices" card (icon: `Receipt`, links to `/account/invoices`, description: "View receipts for your purchases") — previously invoices were only visible to B2B
- **B2B dashboard**: updated Invoices card description to "View paid invoices and billing records for your company."

`app/account/invoices/page.tsx`:
- Reads `customer.customer_type` to determine `isB2B`
- Fixed hardcoded `"B2B"` account badge — now shows `"Personal"` for B2C customers
- Page title: B2B → "Invoices", B2C → "Receipts & Invoices"
- Breadcrumb label updated to match page title
- Empty state: B2B → "No invoices yet. Paid orders will appear here after checkout." / B2C → "No receipts yet. Your paid orders will appear here."
- When `pdf_url` is absent: shows `"PDF pending"` pill badge instead of nothing

---

### Stripe Order Reference Audit (no code changes)

**Root cause identified:** Laravel's `POST /payments/create-session` does not return `order_ref` in its response. The order is created by the webhook (`checkout.session.completed`), not at session creation time. Frontend code is correct on both channels (URL param + sessionStorage fallback), but both are empty because the backend never supplies the value.

**Backend fix required:** Create the order record at session creation time, generate `order_ref`, return it in the response body (`data.order_ref`) AND embed it in the Stripe `success_url`:
```
{FRONTEND_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}&order_ref=OKL-XXXXX
```
Frontend requires no changes once the backend supplies the field.

---

## Completed in Previous Session — Admin RBAC, Product Card & Bug Fixes (2026-04-19/20)

### Product Card — Full-Bleed Image

**File:** `components/shop/product-card.tsx`

The product card was redesigned so the tyre image fills the entire card instead of being confined to a top `aspect-[4/3]` section.

**Changes:**
- Image is now `position: fill` covering the full card (no separate image container)
- `object-contain` keeps the full tyre visible with no cropping
- Card has `min-h-[360px]` so the `fill` image has a concrete height reference
- Info panel (brand, name, size, price, buttons) is pinned to the bottom with a **frosted-glass** treatment (`backdrop-blur-md` + `bg-white/88`) so text stays readable over any image
- Hover zoom reduced to `scale-[1.05]` (was 1.08/1.1) since the image is now larger
- Type badge and glare overlay kept, moved to correct `z-index` layers above the image

---

### Admin Panel — Auth UX & `must_change_password` Flow

#### New: `/admin/change-password` page
**File:** `app/admin/change-password/page.tsx`

- Standalone page within AdminShell for forced password changes
- Amber warning banner: "Your account is using a temporary password"
- Current password, new password (with 4-level strength bar), confirm fields
- Calls existing `changePassword` server action (`PUT /api/v1/admin/profile/password`)
- On success: clears `admin_must_change` cookie, redirects to `/admin`

#### Updated: `app/admin/actions.ts`
- **Key fix:** Was reading `json.data?.admin` from login response — backend confirmed the correct key is `json.data?.user`. This caused all admin cookies (role, display name, must_change_password) to be `undefined` on every login, silently breaking RBAC.
- Now reads `json.data?.user` correctly
- Stores `admin_must_change` cookie (`"1"` or `"0"`) on login based on `must_change_password` flag
- Stores `admin_role_label` cookie (human-readable label from API, e.g. `"Super Admin"`)
- Stores `admin_display_name` cookie (prefers `display_name` → `first_name` → `name`)
- If `must_change_password === true` → redirects to `/admin/change-password` instead of dashboard
- `logoutAdmin` now also deletes `admin_role_label` and `admin_must_change` cookies

#### Updated: `app/admin/profile/actions.ts`
- `updateProfile` now accepts `{ first_name, last_name, display_name, name }` instead of `(name, email)` — email is read-only
- On success: refreshes `admin_display_name` and `admin_name` cookies
- `changePassword`: on success reads `res.data?.user?.must_change_password` from response and sets `admin_must_change=0` cookie to dismiss the persistent banner

#### Updated: `components/admin/admin-shell.tsx`
- **Top-bar dropdown** on avatar button: My Profile → `/admin/profile`, Change Password → `/admin/change-password`, Sign Out (form action `logoutAdmin`)
- **`must_change_password` banner**: persistent amber bar shown on all pages (except `/admin/change-password`) when `admin_must_change=1` cookie is set — "Your account is using a temporary password. [Change password →]"
- **Role badge colors**: `super_admin` = dark (`bg-gray-900 text-white`), `admin` = blue, `editor` = green, `order_manager` = amber
- **Display name**: reads `admin_display_name` cookie for name display; falls back to `admin_name`
- **Role label**: reads `admin_role_label` cookie (set from API `role_label` field) instead of a client-side map

#### Updated: `components/admin/profile-ui.tsx`
- Edit form now has: **First Name**, **Last Name**, **Display Name** fields (split from single `name`)
- Email shown as read-only in edit mode
- Role badge uses `profile.role_label ?? ROLE_LABELS[profile.role]` (API label preferred)
- Cancel resets all three name fields to original profile values

#### Updated: `components/admin/users-manager.tsx`
- **Password field removed from create modal** — backend auto-generates and emails a temporary password
- Create modal shows blue info notice: "A temporary password will be sent to the user's email address."
- After successful user creation: shows green banner "User created. Login details sent to {email}" for 6 seconds
- Role badge display uses `user.role_label ?? ROLE_LABELS[user.role]` (API label preferred)

#### Updated: `app/admin/users/actions.ts`
- `createUser` no longer requires or sends `password` in the request body

---

### Admin RBAC — Permissions Map & Route Guard

#### New: `lib/admin-permissions.ts`

```typescript
export const ROLE_ACCESS: Record<string, string[]> = {
  super_admin:   ["dashboard", "products", "orders", "quotes", "articles", "hero_slides", "brands", "settings", "users", "supplier"],
  admin:         ["dashboard", "products", "orders", "quotes", "articles", "hero_slides", "brands", "settings", "supplier"],
  editor:        ["dashboard", "articles", "hero_slides"],
  order_manager: ["dashboard", "orders", "quotes"],
};

export function canAccess(role: string, section: string): boolean { ... }
export const PATH_SECTION: Record<string, string> = { ... }; // path prefix → section key
```

Mirrors backend ENUM exactly. Role strings confirmed by backend: `super_admin`, `admin`, `editor`, `order_manager` only.

#### Shell nav filtering
```typescript
// Shows all items when role not yet loaded (!role fallback prevents
// blank nav for users whose admin_role cookie pre-dates this feature)
const visibleNav = NAV.filter(({ section }) =>
  section === null || !role || canAccess(role, section)
);
```

NAV items replaced hardcoded `roles` arrays with a `section` key. Profile always visible (`section: null`).

Result:
- `editor` → sees Dashboard, Articles, Hero Slides only
- `order_manager` → sees Dashboard, Orders, Quote Requests only
- `admin` → sees all except Users
- `super_admin` → sees everything

#### Client-side route guard (in `AdminShell`)
```typescript
useEffect(() => {
  if (!role) return;
  const section = Object.entries(PATH_SECTION).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];
  if (section && !canAccess(role, section)) {
    router.replace("/admin/unauthorized");
  }
}, [pathname, role, router]);
```

Redirects to existing `/admin/unauthorized` page if a user navigates directly to a restricted section.

#### Updated: `lib/admin-api.ts`
Added to `AdminUser` and `AdminProfile` types:
- `role_label?: string` — human-readable label from API (e.g. `"Super Admin"`)
- `must_change_password?: boolean` — on `AdminProfile` only

---

### Bug Fix — `admin_role` Cookie Missing for Existing Sessions

**Problem:** After RBAC was added, users who had logged in before the `admin_role` cookie was introduced showed only the Profile nav item.

**Root cause:** The nav filter `section === null || canAccess(role, section)` — when `role = ""` (cookie absent), `canAccess` returns `false` for all sections. Only `section: null` (Profile) survived.

**Fix:** Added `|| !role` fallback so that when role is empty (not loaded or cookie not yet set), all nav items show. The route guard already had `if (!role) return` so it was not affected.

---

## Completed in Previous Session — Account Sub-pages & Shop Auth Fixes (2026-04-19)

### New Account Pages

All four pages below were missing (404) and have been created:

#### `app/account/quotes/page.tsx` — Quote Requests
Server component. Reads `customer_token` cookie; redirects if unauthenticated. Fetches `GET /api/v1/auth/quotes` with Bearer token.
- Status types: `pending | reviewed | approved | rejected` with colored badges
- Empty state with "Request a Quote" CTA linking to `/quote`
- Each quote shows: ref, product details, quantity, date, status badge, notes

#### `app/account/invoices/page.tsx` — Invoices
Server component. Fetches `GET /api/v1/auth/invoices` with Bearer token.
- Table: Invoice #, issued date, due date, amount (€), status badge, PDF download button
- Statuses: `paid` (green), `unpaid` (amber), `overdue` (red)
- Empty state with "Contact support" link

#### `app/account/company/page.tsx` — Company Details
Client component using `useCustomerAuth()`.
- Editable: Company Name, Industry (dropdown of 10 options)
- Read-only: VAT Number (with "Contact support to update" link), Email
- Saves via `updateCustomerProfile({ company_name, industry })`
- Success/error feedback inline

#### `app/account/vat/page.tsx` — VAT Status
Client component using `useCustomerAuth()`.
- If VAT on file: shows number, "VAT number on file" badge (green), "Verification pending" notice (amber), EU VIES portal link
- If no VAT: amber alert + "Contact support to add VAT" button
- Info card explaining B2B tax-exempt eligibility
- Link to `/account/company` for managing company details

#### `lib/customer-auth.ts`
Added `industry?: string` to `ProfileData` type (was missing, caused TypeScript error in company page).

---

### Shop — Proxy Routes with Auth Forwarding

Three Next.js API proxy routes forward `customer_token` cookie as `Authorization: Bearer` to the Laravel API, bypassing CORS:

| Route | Proxies to |
|---|---|
| `app/api/shop/products/route.ts` | `GET /api/v1/products?...` |
| `app/api/shop/brands/route.ts` | `GET /api/v1/products/brands` |
| `app/api/shop/specs/route.ts` | `GET /api/v1/products/specs` |

`shop-catalogue.tsx` updated to call these proxy routes (`/api/shop/products`, `/api/shop/brands`, `/api/shop/specs`) instead of calling the external API directly.

### Shop — Product Detail Page Auth
`app/shop/[id]/page.tsx`: reads `customer_token` cookie server-side, passes it to `apiFetch` as Bearer token. Previously returned 404 because unauthenticated requests got 401 from the API.

### Shop — Image Performance
- `product-card.tsx`: replaced `<img>` with Next.js `<Image fill>` + `sizes` prop
- `product-gallery.tsx`: replaced both main image and thumbnails with `<Image>`
- `product-grid.tsx`: passes `priority={i < 3}` to first 3 cards

### Login — Router Cache Fix
`app/login/page.tsx`: changed `router.push(destination)` to `window.location.href = destination` after successful login. Prevents Next.js router cache from replaying a stale `/shop → /login` redirect after the user had just authenticated.

---

## Completed in Previous Session — Auth Loading & Redirect Fixes (2026-04-18)

### Auth Loading Delay & Flash Fixed

**Problem:** Navbar briefly showed login icon (unauthenticated state) before switching to profile icon once `/me` fetch resolved.

**Changes:**

| File | Change |
|---|---|
| `components/navbar.tsx` | Checks `isLoading` from `useCustomerAuth()`. Shows animated skeleton while loading instead of the login/profile button. |
| `app/login/page.tsx` | Calls `await refreshCustomer()` before `router.push()` so auth context is fully populated before the account page renders. |

### Middleware — `redirect` Param + Prefetch Skip

**File:** `middleware.ts`

1. **`callbackUrl` → `redirect`:** Login redirect URL param renamed. All server-side redirects updated to match. Login page reads `redirect` first, falls back to `callbackUrl`.

2. **Prefetch skip:** Middleware returns `NextResponse.next()` for requests with `Next-Router-Prefetch: 1` header to prevent Next.js caching stale redirects.

**Protected routes:** `/shop`, `/checkout`, `/account` (and all sub-paths).

---

## Completed in Previous Session — Customer Auth, Account Pages & Design Audit (2026-04-18)

### NextAuth Removed — Replaced with Direct Laravel Cookie Auth

`next-auth` has been **fully uninstalled**. The entire auth system now runs on a `customer_token` httpOnly cookie set by the Next.js API layer after proxying to Laravel.

**New auth files:**

| File | Purpose |
|---|---|
| `lib/customer-auth.ts` | Client-side helpers: `loginCustomer`, `registerCustomer`, `logoutCustomer`, `forgotPassword`, `resetPassword`, `getCustomerProfile`, `updateCustomerProfile`. All call relative `/api/auth/customer/*` routes. |
| `lib/get-customer.ts` | Server-side helper: `getCustomerFromCookie()` reads `customer_token` cookie and calls `GET /api/v1/auth/me` with Bearer token. |
| `context/CustomerAuthContext.tsx` | `CustomerAuthProvider` + `useCustomerAuth()` hook. State: `customer`, `isAuthenticated`, `isLoading`. Methods: `login()`, `logout()`, `refreshCustomer()`. |

**New API proxy routes (all under `app/api/auth/customer/`):**

| Route | Method | Behaviour |
|---|---|---|
| `login/route.ts` | POST | Proxies to Laravel `/auth/login`; sets httpOnly `customer_token` cookie (7-day) |
| `register/route.ts` | POST | Proxies to Laravel `/auth/register` |
| `logout/route.ts` | POST | Calls Laravel `/auth/logout`; always clears cookie |
| `forgot-password/route.ts` | POST | Proxies to Laravel `/auth/forgot-password` |
| `reset-password/route.ts` | POST | Proxies to Laravel `/auth/reset-password` |
| `me/route.ts` | GET | Reads cookie; proxies to Laravel `/auth/me` |
| `profile/route.ts` | PUT | Reads cookie; proxies to Laravel `/auth/profile` |
| `change-password/route.ts` | PUT | Proxies to Laravel `/auth/change-password` |
| `addresses/route.ts` | GET + POST | List and create addresses |
| `addresses/[id]/route.ts` | PUT + DELETE | Edit and delete addresses |

**`customer_type` values:** always lowercase — `"b2c"` and `"b2b"`.

---

### New Auth Pages

| Page | Path | Notes |
|---|---|---|
| Login | `app/login/page.tsx` | Email + password; handles `email_verified: false` and `must_reset: true` |
| Register | `app/register/page.tsx` | Individual/Business toggle; VAT validation; country/industry dropdowns |
| Forgot Password | `app/forgot-password/page.tsx` | Email input; success screen |
| Reset Password | `app/reset-password/page.tsx` | Token + email from URL; password strength indicator |
| Verify Email | `app/verify-email/page.tsx` | Resend button; `?verified=true` success state |

---

### Account Pages

| Page | Notes |
|---|---|
| `app/account/page.tsx` | B2C (3 cards) / B2B (6 cards) conditional dashboard |
| `app/account/profile/page.tsx` | Personal info + change password; toast feedback |
| `app/account/addresses/page.tsx` | Card grid; add/edit/delete modal; default badge |
| `app/account/orders/page.tsx` | Order list |
| `app/account/orders/[ref]/page.tsx` | Order detail + ShipmentTracker |
| `app/account/quotes/page.tsx` | Quote requests list with status badges |
| `app/account/invoices/page.tsx` | Invoices table with PDF download |
| `app/account/company/page.tsx` | Company name + industry edit; VAT read-only |
| `app/account/vat/page.tsx` | VAT status + VIES portal link |

---

## Completed in Previous Session — Adyen, Car Finder, Shipment Tracker & Supplier Intel (2026-04-18)

### Payment — Stripe replaced with Adyen Drop-in

Stripe fully removed. Adyen Web v6 Drop-in is now the payment provider. Adyen Sessions flow: Laravel creates session → returns `{ session_id, session_data, client_key }` → frontend mounts Drop-in via `useEffect`.

### Shop — Wheel-Size Car Finder (4-step cascade)

Make → Model → Year → Modification/Trim → Find Tyres.
Proxy routes: `app/api/shop/makes`, `models`, `years`, `modifications`, `car-finder`.
**Required env var:** `WHEEL_SIZE_API_KEY=your_key`

### Shipment Tracker
**File:** `components/account/shipment-tracker.tsx` — States: `loading`, `fetching` (auto-polls every 60s up to 5×), `no-data`, `error`, `ok`.

### Admin — Supplier Intelligence Page
New page `/admin/supplier` — visible to `super_admin` and `admin` only.

---

## Completed in Previous Sessions — FET Page, Shop, Admin CMS, SEO, i18n

See prior entries for:
- FET Engine Treatment page (`/fet`) — light green design system, 7 sections, ROI calculator
- Shop page — two-row filter bar, live API, Car Finder
- Admin CMS — Products, Articles, Orders, Brands, Hero Slides, Quotes, Settings, Supplier Intel, Users
- GSAP animation system — `lib/gsap.ts`, hooks, route transitions
- i18n — EN/DE/FR via `lib/translations.ts` + `context/language-context.tsx`
- SEO — sitemap, robots.txt, OG image, JSON-LD schema
- Email API — Resend-powered `/api/contact` and `/api/quote`
- Mobile responsiveness

---

## Current UI Status

| Section | Status |
|---|---|
| Navbar | Complete — logo, icon buttons, mobile drawer, language switcher, mega menus, `useCustomerAuth`, loading skeleton |
| Hero slider | Complete — GSAP parallax + crossfade, per-slide duration |
| Homepage sections | Complete — Categories, Why Okelcor, Brands, Logistics, TBR, REX, CTA |
| Floating bar + Footer | Complete |
| Shop page | Complete — filter bar, search-first UX, live API, Car Finder |
| **Product card** | **Updated** — full-bleed image fills entire card, frosted info panel at bottom |
| Product detail page | Complete |
| Login page | Complete — `/login`; verified + must_reset handling; B2C/B2B redirect |
| Register page | Complete — `/register`; Individual/Business toggle; VAT validation |
| Forgot / Reset Password | Complete |
| Verify Email | Complete |
| Account dashboard | Complete — `/account`; B2C / B2B conditional |
| Account profile | Complete — personal info + change password |
| Account addresses | Complete — add/edit/delete modal |
| **Account orders** | **Updated** — Pay Now CTA for pending Stripe orders; payment_url → button; no URL → amber email notice |
| **Account order detail** | **Updated** — `OrderPaymentCard` client component; dynamic payment section via proxy `/api/account/orders/{ref}/checkout`; paid / stripe / bank_transfer / unknown states; shipment event crash fixed; Phase 2B-2: EU Entry Certificate card (amber/green, gated on `declaration_required`) |
| **Account quotes** | **Updated** — progress tracker, normalized status, quoted CTA, note filter, admin_notes block |
| **Account invoices** | **Updated** — PDF download via auth proxy; "PDF pending" pill; B2C receipt labels |
| **Account company** | **Complete** — `/account/company`; editable company name + industry |
| **Account VAT** | **Complete** — `/account/vat`; VAT status + VIES link |
| **Quote page / RFQ form** | **Updated** — Phase 2A-2: tyre condition toggle (new/used), used tyre grade + notes, dynamic tyre size rows, contact person, company address/city/postal, EU-aware incoterm selector (DAP/DDP/EXW vs FOB/CIF/EXW), VAT required for EU B2B (Phase 2A-1) |
| Cart drawer | Complete |
| **Checkout page** | **Updated** — Stripe Checkout; live VAT preview; Phase 2A-1: EU B2B VAT required (`lib/eu-vat.ts`); Germany amber note always shown; submit blocked until VAT valid for EU B2B outside Germany |
| **Checkout return** | **Updated** — `/checkout/return`; "Order received" copy; `order_ref` from URL param + sessionStorage fallback (awaiting backend fix to supply `order_ref`) |
| Fuel Echo Tech page | Complete — `/fet`; green theme; ROI calculator |
| About / Contact / News | Complete |
| 404 / Error / Loading | Complete |
| Privacy / Terms / Imprint | Complete |
| i18n (EN/DE/FR) | Complete |
| Analytics (GA4) | Complete |
| **Admin login** | **Updated** — `must_change_password` redirects to change-password page |
| **Admin change-password** | **New** — `/admin/change-password`; forced change with strength bar |
| **Admin shell** | **Updated** — top-bar dropdown, must_change banner, role badge colors, RBAC nav; EU Declarations nav item (FileCheck icon) |
| **Admin RBAC** | **Updated** — `lib/admin-permissions.ts`; `eu_declarations` section added to super_admin/admin/order_manager; PATH_SECTION entry added |
| **Admin EU Declarations list** | **New** — `/admin/eu-declarations`; fetches `GET /admin/eu-declarations`; columns: Order Ref, Customer/Company, Email, Country, VAT, Status badge, Signed, Created, View button |
| **Admin EU Declarations detail** | **New** — `/admin/eu-declarations/[id]`; status banner, order/customer card, declaration details, optional document download, notes section |
| Admin profile | Complete — first/last/display name fields; role label from API |
| Admin users | Complete — create without password; temp password notice; role_label display |
| **Admin order actions** | **New** — Cancel Order (admin/order_manager/super_admin); Delete Order (super_admin only, confirm-ref modal); 422/409 error handling; shipment event crash fixed; Phase 2B-2: EU compliance card with declaration_required/status/id (linked)/signed_at |
| **Admin order activity log** | **New** — `ActivityLog` card in order detail; timeline with old→new diff, actor email, IP, notes |
| **Account invoices (B2C)** | **Updated** — Receipts & Invoices card added to B2C dashboard; previously B2B only |
| **Account invoices page** | **Updated** — customer-type-aware title/badge/empty state; PDF download via auth proxy |
| **Quote form** | **Updated** — file attachment upload (PDF/CSV/XLS/XLSX, max 10 MB); multipart forwarding to Laravel |
| **Admin quote detail** | **Updated** — Phase 2A-2: contact person, VAT number, business type, company address, tyre condition, incoterm, budget/timeline rows; new Tyre Items table card; new Used Tyre Details card (conditional); attachment card; Convert to Order modal |
| **Admin quote → order** | **Updated** — `QuoteConvertModal`; Phase 2A-3: prefills item rows from `tyre_items` array; size validation per row; helper text banner; legacy single-row fallback |
| **Admin dashboard KPIs** | **Updated** — connected to real `/admin/dashboard` endpoint; AOV card shows period label + paid order count |
| Admin products / articles / orders / quotes / brands / hero-slides / settings / supplier | Complete |

---

## Admin Architecture

### Cookie Set on Login (`POST /api/v1/admin/login`)

Response shape: `{ data: { token: "...", user: { role, role_label, name, first_name, display_name, must_change_password, last_login_at, ... } } }`

| Cookie | httpOnly | Purpose |
|---|---|---|
| `admin_token` | ✅ | Auth bearer token — sent on every admin API call |
| `admin_role` | ❌ | Role string (`super_admin`, `admin`, `editor`, `order_manager`) — used for RBAC |
| `admin_role_label` | ❌ | Human-readable label from API (e.g. `"Super Admin"`) — shown in UI |
| `admin_name` | ❌ | Full name from API |
| `admin_display_name` | ❌ | Display name (prefers `display_name` → `first_name` → `name`) — shown in shell avatar |
| `admin_must_change` | ❌ | `"1"` if password change required — drives persistent amber banner |

### RBAC Permission Map (`lib/admin-permissions.ts`)

```
super_admin   → all sections (including eu_declarations)
admin         → all except users (including eu_declarations)
editor        → dashboard, articles, hero_slides, promotions, fet
order_manager → dashboard, orders, quotes, supplier, eu_declarations
```

`canAccess(role, section)` is the single source of truth. Used by:
- Shell sidebar nav filter
- Client-side route guard (redirects to `/admin/unauthorized`)

### Profile Endpoints
- `GET /api/v1/admin/profile` → `{ data: { role, role_label, ... } }` (user object directly under `data`)
- `PUT /api/v1/admin/profile` → accepts `{ first_name, last_name, display_name, name }`
- `PUT /api/v1/admin/profile/password` → accepts `{ current_password, password, password_confirmation }`; returns `{ data: { user: { must_change_password: false, ... } } }`

---

## Auth Architecture (Customer)

```
Browser                Next.js                    Laravel API
  │                      │                              │
  ├─ POST /api/auth/customer/login ──────────────────► POST /api/v1/auth/login
  │                      │  ◄── { token, user } ────────┤
  │  ◄── Set-Cookie: customer_token (httpOnly) ─────────┤
  │                      │                              │
  ├─ GET /api/auth/customer/me ─────────────── Bearer ► GET /api/v1/auth/me
  │  ◄── { data: Customer } ────────────────────────────┤
  │                      │                              │
  └─ POST /api/auth/customer/logout ── Bearer ────────► POST /api/v1/auth/logout
     ◄── cookie cleared ──────────────────────────────  │
```

**Middleware:** Reads `customer_token` cookie synchronously. Redirects to `/login?redirect={path}` for protected routes. Prefetch requests (`Next-Router-Prefetch: 1`) always pass through.

**Server components:** Use `getCustomerFromCookie()` from `lib/get-customer.ts`.
**Client components:** Use `useCustomerAuth()` from `context/CustomerAuthContext.tsx`.

---

## GSAP Implementation

```
lib/gsap.ts          ← single import for gsap, ScrollTrigger, ease, scrollDefaults
hooks/useReveal.ts   ← scroll-reveal
hooks/useStagger.ts  ← stagger children
hooks/useParallax.ts ← scrubbed parallax
app/template.tsx     ← GSAP page fade + ScrollTrigger.refresh() on every route change
```

---

## Completed in Session — Stripe Checkout Fixes (2026-05-02)

### Stripe Session Proxy — Body Forwarding Fix

**File:** `app/api/checkout/stripe-session/route.ts`

**Problem:** `request.text()` can return an empty string under certain Next.js 16 conditions, causing the proxy to forward `{}` to Laravel. Laravel validated `payment_method` as required and returned a 422 error visible to the user.

**Fix:**
- Switched from `request.text()` to `request.json()` + `JSON.stringify()` — body is explicitly parsed then re-serialised, throwing cleanly if empty/invalid
- Hardcoded `Content-Type: application/json` on the outbound request (no longer reflects the incoming header, which could carry a charset suffix)

**Diagnostic logging added (temporary):**
```
[stripe-session] target URL      — exact Laravel endpoint (confirms API_URL env var)
[stripe-session] request body    — full payload forwarded
[stripe-session] HTTP status     — Laravel response code
[stripe-session] has checkout_url — whether data.checkout_url is a string
[stripe-session] has order_ref   — whether data.order_ref is a string
[stripe-session] raw response    — first 600 chars of Laravel response
```

**API URL resolution order:**
```
process.env.API_URL  >  process.env.NEXT_PUBLIC_API_URL  >  "http://localhost:8000/api/v1"
```
Ensure `NEXT_PUBLIC_API_URL=https://api.okelcor.com/api/v1` is set in all deployment environments.

---

### Checkout Return Page — Stripe-Only Rewrite

**File:** `app/checkout/return/page.tsx`

Full rewrite to remove dead Mollie code and align with Stripe Checkout + backend webhook flow.

**Changes:**
- Removed: loading / pending / failed states, Mollie status-check fetch, `amount` state, `Loader2` import
- Two states only:
  - `session_id` in URL → **"Order received"** card (success)
  - No `session_id` → **"Check your email"** card (fallback / direct nav)
- Copy: *"Your payment was submitted successfully. We'll email your confirmation once Stripe confirms the payment."* — avoids claiming payment is confirmed from URL alone (webhook is source of truth)
- `order_ref` display: shown as a pill when present
- All colours use CSS variables (`var(--primary)`, `var(--foreground)`, `var(--muted)`)

**`order_ref` reading (reliable, two-source):**
```typescript
// 1. URL param — present if backend includes order_ref in Stripe success_url
const queryOrderRef = searchParams.get("order_ref") ?? "";

// 2. sessionStorage fallback — written by checkout-flow.tsx before redirect
const [sessionRef, setSessionRef] = useState("");
useEffect(() => {
  const stored = sessionStorage.getItem("stripe_order_ref") ?? "";
  if (stored) setSessionRef(stored);
  sessionStorage.removeItem("stripe_checkout_session_id");
  sessionStorage.removeItem("stripe_order_ref");
}, []);

const orderRef = queryOrderRef || sessionRef;
```

Key fix from previous bug: `orderRef` is derived reactively from `queryOrderRef` (not frozen in a lazy `useState` initialiser), so it updates correctly after `useSearchParams()` resolves during hydration.

---

### Checkout Flow — Reliable sessionStorage Writes

**File:** `components/checkout/checkout-flow.tsx`

**Problem:** sessionStorage was only written inside `if` guards — if the backend response omitted `order_ref`, the key was never set and the return page fallback silently had nothing to read.

**Fix:** Unconditional writes with explicit variable extraction:
```typescript
const checkoutSession = String(checkoutData.checkout_session_id ?? "");
const orderRef        = String(checkoutData.order_ref ?? "");

sessionStorage.setItem("stripe_checkout_session_id", checkoutSession);
sessionStorage.setItem("stripe_order_ref", orderRef);
// → then clearCart() + window.location.href = checkoutUrl
```

Both keys are **always written before the Stripe redirect**, even if empty, so the return page always finds consistent keys in sessionStorage.

**Backend response shape expected:**
```json
{
  "data": {
    "checkout_url": "https://checkout.stripe.com/...",
    "checkout_session_id": "cs_...",
    "order_ref": "OKL-XXXXX"
  }
}
```

---

### Stripe Checkout — Frontend/Backend Contract (Confirmed)

| Thing | Who handles it |
|---|---|
| Customer confirmation email | Backend (auto, on `checkout.session.completed` webhook) |
| Admin notification email | Backend (auto, on webhook) |
| `/checkout/return` page | Frontend ✅ |
| `/checkout/cancel` page | Frontend ✅ |
| Showing `order_ref` on return page | Frontend reads from URL param → sessionStorage fallback |

**Important timing:** Stripe redirect fires before the webhook. Never fetch order status on the return page — the webhook may not have fired yet. Email is the source of truth.

---

## Completed in Session — Domain Migration & Customer Email Blast (2026-04-22/23)

### Domain: okelcor.de → okelcor.com

The website is now live at **okelcor.com**. All okelcor.de email references updated:

- `lib/constants.ts` — `COMPANY_EMAIL` → `info@okelcor.com`, `COMPANY_NOREPLY_EMAIL` → `noreply@okelcor.com`
- `components/admin/settings-panel.tsx` — contact/quote email defaults → `info@okelcor.com`
- `lib/translations.ts` — all 7 `errGeneric` messages (EN/DE/FR/ES) → `info@okelcor.com`
- `app/sitemap.ts` — added `/fet` route (priority 0.8)
- `next.config.ts` — already had `api.okelcor.com` image hostname (no change needed)

**Note:** Domain-level redirect (okelcor.de → okelcor.com) must be configured at the DNS/hosting provider — not possible from within Next.js.

### Admin — Platform Migration Email

Allows admins to notify all registered customers about the new platform and prompt password setup.

#### New: `app/api/admin/customers/migration-email/route.ts`
- `POST` with `{ test_mode: true }` → sends to `johngraphics18@gmail.com` only
- `POST` with `{ test_mode: false }` → paginates all customers, batches 100 per Resend `batch.send()` call
- Returns `{ sent, failed, total, test_mode }`
- Requires `admin_token` cookie (same auth as all admin routes)

#### Updated: `app/admin/customers/page.tsx`
New "Platform Migration Email" card with:
- Description + amber warning banner (test first)
- **Send Test Email** button → test mode send
- **Send to All Customers** button → opens confirmation modal
- Confirmation modal with cancel/confirm
- Result cards showing sent/failed/total counts

Email template: dark Okelcor header, migration announcement, "Set Your Password →" CTA to `/forgot-password`, "What's new" feature list, branded footer.

---

## Known Issues / Remaining Tasks

### High Priority

1. **Stripe `order_ref` not displayed on return page — backend fix required** — Root cause confirmed: Laravel's `POST /payments/create-session` does not return `order_ref` because the order is created by the Stripe webhook, not at session creation time. Frontend is already wired and waiting. Backend must: (a) create the `Order` record at session creation time with `status: pending`, `payment_status: pending`, (b) return `order_ref` in `data.order_ref`, (c) embed it in the Stripe `success_url` as `?order_ref=OKL-XXXXX`, (d) have the webhook update the existing order (paid + confirmed) instead of creating a new one. No frontend changes needed.

### Medium Priority

2. **Crisp live chat `X-Crisp-Tier` unresolved** — Main currently uses `"website"` tier (working). User confirmed credentials require `"plugin"` tier, but switching to `plugin` on main caused 404. Must test in isolation on the production Crisp account before merging dev version. Dev branch has `plugin` + simplified env vars (`CRISP_IDENTIFIER`/`CRISP_KEY` only). Do not merge until confirmed.

3. **Stripe diagnostic logging** — Temporary `console.log` lines in `app/api/checkout/stripe-session/route.ts` (target URL, request body, HTTP status, has checkout_url, has order_ref). Remove once the backend confirms the response shape.

4. **Invoice download debug logs** — Temporary `console.log` lines in `app/api/account/invoices/[id]/download/route.ts` (token present, target URL, Laravel status, error body). Remove once PDF download is confirmed working in production.

5. **Admin quote attachment debug log** — Temporary `console.log` in `app/admin/quotes/[id]/page.tsx` logging all 6 attachment field values. Remove once attachment display is confirmed.

6. **Admin existing sessions after RBAC** — Users who logged in before `admin_role` cookie was introduced will see all nav items. They need to log out and back in once.

7. **DNS redirect** — Configure okelcor.de → okelcor.com redirect at DNS/hosting level.

8. **Namecheap deploy pending** — Backend commits `b89dd2e` (bus freight tracking), `996fc0b` (email deliverability), `fbe2d3f` (bank details), `0e8cdfa` (carrier_type fix), `3e7e682`/`50ffd1c` (event_date fix) need deploying. Run `php artisan migrate --force` — two new migrations in `b89dd2e`.

### Low Priority

9. **Newsletter backend** — `components/newsletter-strip.tsx` shows success UI but does not POST to any endpoint.

10. **Unused public assets** — Old placeholder SVGs in `public/brands/` safe to delete.

---

## Development Workflow

Before making UI changes, always read:
1. `docs/architecture.md`
2. `docs/DESIGN_SYSTEM.md`
3. `docs/page-guidelines.md`
4. `docs/session-handoff.md`
5. `docs/visual-references.md`

Rules:
- Use `var(--primary)`, `var(--primary-hover)`, `var(--foreground)`, `var(--muted)` — never hardcode duplicates
- The FET page (`/fet`) uses its own green palette — do NOT apply `var(--primary)` orange there
- All buttons use `rounded-full` (pill shape)
- Prefer server components; only use `"use client"` where hooks or browser APIs are required
- i18n: use `useLanguage()` in client wrappers
- Auth (customer): use `useCustomerAuth()` in client components; `getCustomerFromCookie()` in server components; never import from `next-auth`
- Auth (admin): use `adminApiFetch()` from `lib/admin-api.ts`; permissions via `canAccess()` from `lib/admin-permissions.ts`
- `customer_type` values are always lowercase: `"b2c"` or `"b2b"`
- Admin login response shape: `json.data.user` (not `json.data.admin`)
- Admin profile/me response shape: `json.data` directly (no `.user` wrapper)
