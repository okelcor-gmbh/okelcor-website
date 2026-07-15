# Okelcor Website — Progress Tracker

**Last updated:** 2026-07-14  
**Branch:** `main`  
**Build status:** TypeScript 0 errors · ESLint clean · Production build passes

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| UI | React 19 · TypeScript 5 · Tailwind CSS v4 |
| Animation | GSAP 3.14 + @gsap/react (sole animation library) |
| Auth (customer) | Custom cookie-based — `customer_token` httpOnly, proxied Laravel API |
| Auth (admin) | Cookie-based — `admin_token`, mandatory 2FA, 5h session TTL |
| Email | Resend (contact + checkout; quote emails owned by backend) |
| Backend | Laravel API — `https://api.okelcor.com/api/v1` |

---

## Module Status

### ✅ Core Website

| Feature | Status | Notes |
|---|---|---|
| Site layout (Navbar, Hero, Footer) | ✅ Complete | GSAP animations |
| Hero Slider | ✅ Complete | GSAP parallax, video slide support |
| Categories Carousel | ✅ Complete | |
| Why Okelcor section | ✅ Complete | |
| Trusted Brands panel | ✅ Complete | |
| Logistics Feature section | ✅ Complete | |
| REX Certification section | ✅ Complete | |
| CTA section | ✅ Complete | |
| Floating Utility Bar | ✅ Complete | |
| FET Engine Treatment page (`/fet`) | ✅ Complete | Green design system, ROI calculator |
| FET Teaser strip | ✅ Complete | |

---

### ✅ Internationalisation (LANG)

| Feature | Commit | Notes |
|---|---|---|
| LANG-1 — i18n foundation + `html lang` server attr | `37578cb` | EN/DE/FR/ES |
| LANG-1B — FET teaser, hero, navbar mega-menu, footer | `d90b54e` | |
| LANG-1C — FET calculator, proof, verified-strip | `5bc76f8` | |
| LANG-2 — locale-aware metadata (all public pages) | `17149ab` | |
| LANG-3 prep — `uiLabels` in CatalogueLanding | `d7f33c2` | |
| Spanish locale in admin article form | `49386cc` | |
| LANG-4 — first-visit geo locale auto-detection | `3a67c29` | `/api/i18n/detect` proxy reads CDN geo header (`x-vercel-ip-country`/`cf-ipcountry`) + cached backend country→locale map (`/i18n/locales`, revalidate 1h); `LanguageProvider` auto-switches on first visit only, stored choice/manual override always wins; graceful default-only fallback until backend live |

---

### ✅ Shop / Catalogue

| Feature | Commit | Notes |
|---|---|---|
| Shop page with filters + pagination | early | |
| Product detail page | early | |
| Rapid Specials campaign banner | `bfa332f` | |
| VAT number validation (EU) | `51ef0e6` | |
| Incoterms / FOB default | `bfa332f` | |

---

### ✅ SEO

| Feature | Commit | Notes |
|---|---|---|
| SEO Phase 1 — Quote & About page optimisation | `933d89d` | Meta, H1, alt text, outbound links |
| SEO Phase 2 — SEO-friendly URL aliases + 301 redirects | `da147c8` | `/tyre-supply-quotation`, `/wholesale-tire-distributors-europe` |
| SEO Phase 3 — Sitemap, robots.txt, structured data | `e9ab6f4` | Organization + WebSite JSON-LD |
| SEO Phase 4A — 12 catalogue landing pages | `d58b7da` | Static pre-rendered |
| SEO Phase 4B — Content depth for all 12 pages | `5019e5d` | FAQPage JSON-LD, popular sizes, internal links |
| SEO Phase 5A — Season/category copy sync (5 pages) | `ce827c9` | Approved copy applied |
| SEO Phase 5B — Brand copy sync (7 pages) | `83a0ac1` | Approved copy applied |
| Internal links on all 12 catalogue pages | `8eac305` | |
| `/tyre-wholesaler` ads/SEO landing refresh | `d012cea` | Dedicated minimal header + footer, darker inventory overlays, SEO-manager lead form → `POST /api/leads/tyre-wholesaler` (proxy to backend `/leads/tyre-wholesaler`, forwards client IP for throttle), raw interest/volume + flat UTM/gclid/fbclid/referrer attribution, CRM-2 preserved, `/tyre-wholesaler/thank-you` conversion page |

---

### ✅ Customer Auth & Account

| Feature | Commit | Notes |
|---|---|---|
| Customer login / register / forgot-password | early | |
| Email verification flow | early | |
| Account dashboard (orders, invoices, profile) | early | |
| Order detail page | `90721f7` | Two-stage auth fallback, inline 404 state |
| Stripe card payments | `ca4ef63` | |
| Order tracking page | `7169151` | |
| Checkout flow | early | |
| Trade documents card (customer-facing) | `d7caa08`+ | View/download generated + shipment docs |
| Delivery confirmation card | `4255f03` | |
| Payment milestone progress (customer) | `a1ef863` | 5-step timeline |
| Order Confirmation acceptance (customer) | `c52ac1b` | Accept + Decline with reason |
| **Portal premium pass + notification inbox** | pending | Dashboard uplift (recent-activity widget + account-status card) and a full customer notification system — navbar bell (30s unread poll), inbox center `/account/notifications` (filters, pagination, "Emailed" tag), email preferences. ✅ Frontend complete · ⏳ backend — see contract block below |

---

### ✅ Admin Panel — Core

| Feature | Commit | Notes |
|---|---|---|
| Admin login + 2FA challenge | `4577470` | |
| Mandatory 2FA setup flow | `4577470` | QR code, recovery codes |
| 5-hour session TTL | `4577470` | |
| Admin profile + password change | `fed0b38` | |
| Role-based access control (RBAC) | `c41a5d3` | super_admin / admin / order_manager / sales_manager / support |
| Admin shell (nav, layout) | early | |
| System Health dashboard | `8ae5911` | Grouped checks, error log, graceful unavailable state |

---

### ✅ Admin Panel — Products & Content

| Feature | Commit | Notes |
|---|---|---|
| Products table + CRUD | early | |
| CSV import / bulk delete | early | |
| Hero slides CMS | early | Video upload support |
| Article CMS | `928a6bc` | TipTap rich text editor |
| Brands management | early | |
| Promotions management | early | |
| Settings page | early | |
| **Media Library** | `fd43ca2` | Standalone `/admin/media` screen — thumbnail grid (collection tabs, search, pagination, upload, delete, copy URL); article editor gets "Browse Media Library" button in image dialog; `MediaPickerModal` overlay for insert-from-library in TipTap; `editor` + `content_manager` roles have access |

---

### ✅ Admin Panel — Marketing

| Feature | Commit | Notes |
|---|---|---|
| Marketing Contacts — list, stats, delete | `a731c86` | `/admin/marketing/contacts` · paginated table with filter (status/company/country/search) · stats cards · unsubscribed rows dimmed |
| Marketing Contacts — CSV import | `dc57662` | Drag-drop + file picker; proxy normalises UTF-8 BOM, trims header whitespace, remaps column names (snake_case) before forwarding to backend import endpoint |
| Bulk Email Campaigns — compose & send | `a731c86` | `/admin/marketing/campaigns` · TipTap HTML composer · debounced recipient-count preview · company/country/status/search filters · send |
| Bulk Email Campaigns — history & progress | `a731c86` | Paginated history table · 3-second poller while status is `queued`/`sending` · progress bar · body-preview modal |
| RBAC — `marketing` section | `a731c86` | `super_admin`, `admin`, `order_manager`; `marketing.manage` permission |

> **CSV import status:** Frontend normalisation ships (`dc57662`). Import still returns `skipped_no_email: 188` — root cause is a column-name mismatch between the normalised CSV and what the Laravel importer expects. Backend team has been notified with full reproduction details; awaiting the exact expected header name.

---

### ✅ Admin Panel — Orders & Documents (DOC series)

| Feature | Commit | Notes |
|---|---|---|
| Orders table + detail | early | |
| DOC-1 — Order Confirmation (AB) stage | `3d7ed95` | Before Proforma Invoice |
| DOC-4 — Public document verification page | `85b7aee` | Token-based, no auth |
| DOC-5 — Financial lock + approval/revision | `a5651f3` | |
| DOC-6 — Customer order confirmation acceptance | `c52ac1b` | Accept + Decline (customer + admin) |
| DOC-7 — Payment milestone workflow | `a1ef863` | 6-stage: pending_proforma → shipment_released |
| DOC-8 — Payment milestone email notifications | `8c8acd4` | Per-stage email status + Resend |
| DOC-9 — Admin order workflow command center | `89f4cb5` | 12-rule priority chain, 6-tab nav, attention badges |
| Trade documents — Packing List | `d7caa08` | Generate + view |
| Trade documents — Delivery Note | `4255f03` | Generate + view |
| Trade documents — Commercial Invoice | `2abc6ec` | Generate + view |
| Trade documents — Shipment doc uploads | `0c681cf` | Upload / delete / view inline |
| Trade documents — Send by email | `2abc6ec` | Modal + backend proxy |
| Superseded / void document handling | `56891e9` | Admin sees dimmed; customer filtered |
| Logistics dashboard v2 | `af5038c` | 9 summary cards, eBay + payment stage filters |
| Signed Proforma Invoice return | 2026-07-03 | Legal paper-trail: Proforma PDF now has a Date/Signature/Stamp block. Customer order page — once a `proforma_invoice` doc exists and no `proforma_signed` one does, shows a prompt + file upload (pdf/jpg/jpeg/png, max 20MB) → `POST /api/account/orders/{ref}/proforma/signed-copy`; swaps to a "✓ Signed copy received" confirmation once uploaded (optimistic local state, no page reload). Uploaded copy appears as a normal entry in `trade_documents` (downloads via the existing generic document-download proxy — no new download route). Admin side: "Signed" badge on the Proforma Invoice row when a signed copy exists |
| Signed Proposal return | 2026-07-03 | Same paper-trail pattern, one stage earlier: Proposal PDF also has a Date/Signature/Stamp block. `QuoteAcceptanceActions` (`/account/quotes/[ref]`) gets an "Upload signed copy instead" file picker next to Accept/Decline → `POST /api/account/quotes/{ref}/proposal/signed-copy` (new proxy); **this is itself an acceptance** — 201 sets local status to `accepted`, same as clicking Accept (no separate state to handle). 422/410 (no active proposal / expired) surfaced as inline errors. Admin: `AdminQuoteFull.proposal_signed_copy_download_url` + a "Signed" badge and download row in the accepted-state block of `ProposalCard` |
| Payment-gated documents — expanded | 2026-07-03 | Packing List, Delivery Note, and Shipment Documents now follow the same full-payment gate as the Commercial Invoice (hidden from `trade_documents` until `balance_paid`/`shipment_released`/`paid`). Server-side only — confirmed no client-side logic assumed pre-payment visibility, so no FE change needed |
| Order line-item editing (correcting wrong figures) | 2026-07-15 | Fixes "no way to fix a wrong price/quantity/product name on a manual order" — previously only the delivery fee was correctable. **Unlocked orders** (`financials_locked` false, `source !== "ebay"`): inline Edit/Delete per row + "Add Item" on the Order Items table → `POST/PATCH/DELETE /admin/orders/{id}/items[/{itemId}]`, `reason` required and shown as a visible field on every mutation (writes to the order audit log), disabled Delete when only one item remains (`cannot_delete_last_item`). **Locked orders**: existing Request Financial Revision modal (DOC-5, `a5651f3`) extended with per-item correction rows, a repeatable "New Items" section, and remove checkboxes → `changes.items`/`changes.new_items`/`changes.remove_item_ids` alongside the existing `delivery_fee`; client-side guard mirrors `revision_would_empty_order` before submit. eBay orders (`source === "ebay"`) get neither path — banner only, matching the backend's 403 `ebay_order_not_editable` enforcement. All mutations `router.refresh()` to pull corrected totals |
| Historical order backfill (admin) | 2026-07-14 | For customers Okelcor already had a relationship with before being onboarded to the system. New `POST /admin/orders` (`orders.update`) — "Add Historical Order" button on the customer detail page's Order History card (`components/admin/add-historical-order-modal.tsx`) opens a 2-step flow: **step 1** order details (ref optional, order date, shipping details, status incl. `processing`, payment status `pending/paid/failed/refunded`, explicit payment-stage picker — `paid` alone defaults server-side to `balance_paid`, so mid-flight orders must set `deposit_paid`/`balance_due` themselves —, carrier/carrier type/tracking number/container number, admin notes, itemized line items or flat total); **step 2** repeatable document-upload rows (type label incl. free-text "Other", notes, file — reuses the existing `POST /admin/orders/{id}/trade-documents/upload` proxy, one call per file) so real invoices/BOLs get attached in the same flow rather than regenerated — per backend, "Generate…" endpoints must never be used for historical orders. 409 `document_generation_blocked_payment_stage` and the payment-gated visibility rule (uploads accepted but hidden from the customer's portal until fully paid) surfaced inline. "Skip for now" / "Done" both proceed to the new order's detail page, where Documents (`TradeDocumentsCard`) and Shipment tracking (Logistics tab, `ShipmentEventManager` + Track Shipment) already existed — no new UI needed there. Customer portal visibility needed no changes — orders match a customer purely by e-mail, already live. **Open item:** `/account/orders` (list page) fetches `GET {API}/orders?email=` directly in a Server Component rather than the `GET /auth/orders` bearer-scoped route the backend note names — pre-dates the API-proxy convention, confirmed working today, left unchanged pending a decision (see chat) |

---

### ✅ Admin Panel — eBay Integration (EB series)

| Feature | Commit | Notes |
|---|---|---|
| EB-1 — OAuth connection UI + token stability | `175ab23` | Connect/disconnect flow |
| EB-2 — Listing status tracking, RBAC gates, sync logs | `0f57e91` | |
| EB-3 — Price/title update sync + bulk update | `a48de19` | Stale indicator |
| EB-4 — Setup & readiness checklist | `29490c7` | Test connection |
| EB-5 — eBay order status sync | `d516c68` | eBay Orders tab in admin |
| Business policies fetch + display | `533e3af` | Copy policy IDs from panel |
| eBay error 932 fix — quarantine `lib/ebay.ts` | `1a03d1b` | All actions via Laravel backend |
| eBay 502 errors — surface real backend messages | `a4cb50a` | |

---

### ✅ Shipment Tracking — Carrier-based (GLS/DHL/ocean freight) — frontend

**Traccar/GPS own-fleet tracking was removed backend-side (2026-07-03; live, verified against
real orders) in favour of real carrier tracking, which is simpler and doesn't need a fleet at
all.** All fleet-only frontend was removed to match: admin fleet dashboard (`/admin/tracking`,
map/device-list/route-trip playback/geofences), the "Assign tracking device" + "Set destination"
controls on the admin order page, and `gps_live` mode (live map, ETA countdown/progress bar) on
the customer side — none of those backend endpoints exist anymore (404). `mode` on the customer
tracking payload is now always `"carrier"`.

| Feature | Notes |
|---|---|
| Admin order page — Overview tab | **Carrier / Carrier Type / Tracking Number** editable fields (`order-detail.tsx:992-1029`) — the one field admin needs to fill in for tracking to work at all. `carrier_type`: `sea`, `air`, `dhl`, `road`, `truck` (`bus` retired). eBay orders auto-backfill carrier/tracking from eBay's own fulfillment record hourly, never overriding a manual entry — same fields, no separate eBay UI |
| Admin order page — Logistics tab | Manual shipment-event log (`ShipmentEventManager` — `POST/PUT/DELETE /admin/orders/{id}/shipment-events`, predates this series, commit `9465e6e`) — optional, for hand-adding/annotating events on top of the carrier sync |
| Admin order page — Order Summary | **Track Shipment** button (`components/admin/tracking/track-shipment-control.tsx`, gated on `canDo(adminRole,"tracking.view")`) — on-demand modal calling `GET /api/admin/orders/{id}/shipment-tracking` (live carrier-API call + persists new events, confirmed working for GLS/DHL/ocean; always returns a usable response incl. `tracking_url` even if the live call fails — only errors when there's no carrier/tracking at all); 3-node stage stepper + shipping overview + "Track on {carrier}'s site ↗" link + newest-first event list (empty state when none synced/entered yet) |
| Customer order page | Unified `OrderTracking` component (`components/account/order-tracking.tsx`) — status hero, 4-step stepper, shipment details incl. "Track on {carrier}'s site ↗" deep link (`tracking_url`, works even with zero events), event timeline with empty state. Polls `/api/account/orders/[ref]/tracking` 30s while shipped, stops on delivered |
| `CustomerTracking` type (`lib/tracking.ts`) | Single shape now: `available:false` (`reason`) or `available:true, mode:"carrier"` with `carrier`/`tracking_number`/`stage`/`tracking_url`/`events`. Trimmed of all GPS-only types (`Device`, `Trip`, `Geofence`, `Position`, `DeliveryEta`) and helpers (`formatCountdown`, `statusStyle`, `parseWkt`, `centroid`, `formatSpeed`, `formatDuration`, `lastSeen`) |
| eBay tracking | eBay's Sell API never exposes the detailed event history to sellers (carrier code + tracking number + ship date only) — not a gap to fix, our own carrier sync covers it since a GLS-carried eBay order reads from the same GLS feed eBay does |
| Removed | `app/admin/tracking/`, `components/admin/tracking/{fleet-dashboard,assign-device-control,set-destination-control}.tsx`, `components/tracking/{fleet-map,delivery-map,location-picker-map}.tsx`, `app/api/admin/tracking/**` (7 routes), `tracking` RBAC section/nav entry, `tracking_device_id`/`dest_lat`/`dest_lon` on `AdminOrderFull`. `tracking.view` permission kept (still gates the Track Shipment refresh) |
| DPD added as recognized carrier | 2026-07-06 | `tracking_url` now resolves for DPD (alongside GLS/DHL/Maersk) — no frontend code change required, the existing "render `tracking_url` if present" logic just starts working for DPD orders. DPD lacks live event auto-sync (no API credentials yet), so `events` stays empty for DPD orders — only the tracking link works for now. See `docs/FRONTEND_NOTE_tracking.md` |

---

### ✅ Admin Panel — Security (SEC series)

| Feature | Commit | Notes |
|---|---|---|
| Security dashboard (2FA adoption, login history) | `213502c` | |
| SEC-3A — In-memory rate limiting (10 routes) | `213502c` | IP-based token bucket |
| Admin upload size cap (50 MB) | `213502c` | |
| `deleteAllProducts` confirmation token | `213502c` | Server-side enforcement |
| Mollie webhook secret check | `213502c` | Env-gated |

---

### ✅ CRM Suite (CRM-1 → CRM-7)

| Feature | Commit | Status |
|---|---|---|
| CRM-1 — Controlled B2B customer onboarding | `39fc8bc` | ✅ Complete |
| CRM-2 — Inquiry quality filtering | `61ddac4` | ✅ Complete |
| CRM-3 — Lead qualification & sales pipeline | `d283e74` | ✅ Complete |
| CRM-3 — Admin notifications bell (lead assignment) | `972859b` | ✅ Frontend complete |
| CRM-3B — Notification center & assignment work queue | `6d3ca6d` | ✅ Frontend complete |
| CRM-4 — Customer segmentation & access control | `cc2cab5` | ✅ Complete |
| CRM-5 — Customer data quality & deduplication | `62850bc` | ✅ Complete |
| CRM-6 — Communication timeline & follow-up automation | `6fd6f58` | ✅ Complete |
| CRM-6B — Rich e-mail compose/reply, signature, customer messaging portal | 2026-07-14 | ✅ Complete (backend confirmed built + tested) |
| CRM-7 — Proposal management & customer acceptance | `224ab1c` | ✅ Frontend complete |
| CRM-8 — Buyer approval & customer lifecycle | `8c85cc0` | ✅ Frontend complete |

#### CRM-6B Detail — Rich E-mail Compose/Reply, Signature, Customer Messaging

Extends the existing CRM-6 communication log with a **real send** path (manual "I called them" / "I emailed them" logging is untouched). Deliberately **not** true inbound-e-mail capture — a customer replying to the actual e-mail in their inbox goes to the admin's personal inbox as before; two-way visibility is via the customer's own portal thread instead. **Needs an order-manager sign-off before launch that portal-only two-way messaging is acceptable** — flagged, not decided by frontend.

| Sub-feature | Status |
|---|---|
| `Communication` type extended (`channel`, `cc`, `attachments`, `message_id`, `in_reply_to`, `staff_read_at`, `customer_read_at`) | ✅ |
| Admin — `components/admin/signature-editor.tsx`: uncontrolled `contenteditable` (loaded once on mount, read only on Save) + `updateSignature` server action, `PUT /admin/profile/signature`, wired into `/admin/profile` | ✅ |
| Admin — `components/admin/email-composer-modal.tsx`: uncontrolled `contenteditable` body, CC chips (max 5), drag-drop attachments (max 5, 10MB each), reply threading (`in_reply_to_id`), inline 422/502 handling (`missing_recipient_email`, `email_send_failed` — failed sends still logged, not data loss) | ✅ |
| `CommunicationTimeline` — "Compose E-mail" button (gated on `recipientEmail`), per-row "Reply", cc/attachment/failed/unread rendering, auto-mark-read (`POST /admin/communications/{id}/read`) on load for inbound unread e-mails | ✅ |
| Wired into customer detail page (`customer.email`) and quote detail page (`quote.email`) | ✅ |
| Proxy routes: `customers/{id}` + `quote-requests/{id}` `communications/send-email` (multipart), `communications/{id}/read`, `communications/{id}/attachments/{index}/download` (binary passthrough) | ✅ |
| Customer portal — `/account/messages` (`components/account/messages-center.tsx`): expandable thread rows, plain-text reply (no attachments from customer side, per spec), attachment download, mark-read-on-open | ✅ |
| `components/account/messages-bell.tsx` — unread badge in navbar (polls list `meta.unread_count`, no dropdown — messages need the full reply flow) + "Messages" dashboard tile | ✅ |
| Proxy routes: `account/communications` (list), `communications/{id}/reply`, `communications/{id}/read`, `communications/{id}/attachments/{index}/download` | ✅ |

#### CRM-8 Detail

| Sub-feature | Commit | Status |
|---|---|---|
| `lib/crm8.ts` — tiers, verification, risk, approval-profile matrix, timeline labels | `8c85cc0` | ✅ |
| Admin nav + RBAC entry (`/admin/customer-approvals`, section `customers`) | `8c85cc0` | ✅ |
| Customer Approvals page — queues, summary cards, table, Access Requests tab | `8c85cc0` | ✅ |
| Buyer Lifecycle card (tier/risk/health, apply profile, approve, restrict, block) | `8c85cc0` | ✅ |
| Access Profile modal (before→after change preview) | `8c85cc0` | ✅ |
| Verification card (add / mark verified / reject) | `8c85cc0` | ✅ |
| Lifecycle Timeline card | `8c85cc0` | ✅ |
| Access Requests table (admin approve/reject) | `8c85cc0` | ✅ |
| Customer portal Request-Access panel (account dashboard, B2B) | `8c85cc0` | ✅ |
| 14 proxy routes (graceful 404/405 degradation) | `8c85cc0` | ✅ |
| FIX — "Check approval status" (retry-login) on pending screen | `2b15758` | ✅ |
| FIX — register verify→review messaging | `2b15758` | ✅ |
| FIX — approval-email status feedback (admin approve success message) | `2b15758` | ✅ |
| Customer profile correction — Edit modal (`components/admin/edit-customer-modal.tsx`) | 2026-07-14 | ✅ Name/email/company/type/VAT (+ "I've confirmed this" checkbox, only sent on change to avoid backend's auto-reset-to-unverified)/industry/phone/country/admin_notes via `PATCH /admin/customers/{id}`, diff-only body; inline 422 email-uniqueness error; success re-syncs `CustomerTimelineCard` |
| Removed — "Platform Migration Email" test-block (leftover, no backend dependency) | 2026-07-14 | ✅ Deleted from `/admin/customers`; `app/api/admin/customers/migration-email` route removed |
| Buyer tier / risk level badges on customers list | 2026-07-14 | ✅ Small coloured badges next to access/segment badges, reusing `lib/crm8` style maps |
| Backend endpoints | — | ⏳ Backend team |

#### CRM-7 Detail

| Sub-feature | Commit | Status |
|---|---|---|
| Proposal lifecycle proxy routes (draft/mark-ready/send/void) | `224ab1c` | ✅ |
| Public proposal acceptance page `/proposals/accept/[token]` | `224ab1c` | ✅ |
| ProposalCard admin component (full state machine) | `224ab1c` | ✅ |
| ProposalBadge in quotes table | `224ab1c` | ✅ |
| Convert-to-Order gated on proposal_status=accepted | `224ab1c` | ✅ |
| Super admin override confirmation | `224ab1c` | ✅ |
| Quote items editor (QuoteItemsCard) | `c93f1c7` | ✅ |
| Import from inquiry button | `c93f1c7` | ✅ |
| ProposalCard gated on itemCount > 0 | `c93f1c7` | ✅ |
| FIX — proposal draft built from persisted quote items (not `tyre_items`) | `3a2941b` | ✅ |
| FIX — send required `name` field in proposal draft items payload | `4a7fa05` | ✅ |
| Signed Proposal return — customer upload (alt. to digital Accept) + admin badge/download | `24ee49b` | ✅ (see Admin Panel — Orders & Documents table) |
| Backend endpoints (7 routes) | — | ⏳ Backend team |
| Quote items backend (5 routes) | — | ⏳ Backend team |

#### CRM-3B Detail — Notification Center & Work Queue

| Sub-feature | Status |
|---|---|
| `AdminNotification` type extended to CRM-3B contract (`severity`, `body`, `action_url`, `related_type`/`related_id`, `dismissed_at`, `metadata`) + legacy `message`/`link` fallbacks | ✅ |
| `MyWorkItem` type (`lib/admin-api.ts`) | ✅ |
| `lib/admin-notifications.ts` — severity styles, type→icon (`NotifIcon`), body/link accessors, `timeAgo` | ✅ |
| Notifications bell — lightweight unread-count poll (30s), list-on-open, severity icons, dismiss, "View all" | ✅ |
| Notifications center page `/admin/notifications` — unread/type/severity filters, mark-all-read, dismiss, pagination | ✅ |
| Work queue page `/admin/my-work` — sectioned (Assigned Leads, Due Follow-ups, Proposal Accepted, Customer Approvals, Access Requests) | ✅ |
| Sidebar nav entries (My Work, Notifications) — visible to all admin roles | ✅ |
| Assignment UX — "Pipeline updated. {name} has been notified." on quote assign | ✅ |
| Follow-ups "Assigned to me" filter tab (`mine=1`) | ✅ |
| Proxy routes: `notifications` (filters), `notifications/unread-count`, `notifications/{id}/dismiss`, `my-work` (graceful 200/empty degradation) | ✅ |
| Backend endpoints (table, service, triggers, dedupe, scheduler) | ⏳ Backend team |

---

## Pending — Backend Contracts

### Proposal → Proforma Gating — Needs `proposal_accepted_at` Surfaced on Order Payload

Backend note: for orders from an accepted CRM-7 proposal, admin should be able to generate/send the
Proforma Invoice right after proposal acceptance, without requiring a separate Order Confirmation
acceptance step. The gate that currently blocks "Generate Proforma" is `customerAcceptancePending`
(`components/admin/order-detail.tsx:544`, `order.customer_acceptance_status === "pending"`), consumed
by `TradeDocumentsCard`. **`AdminOrderFull` (`lib/admin-api.ts`) does not currently expose the
originating quote's `proposal_status`/`proposal_accepted_at`** — there's no field to check. Backend's
own note says to ask if this needs surfacing. **Not implemented — waiting on backend to add e.g.
`order.proposal_accepted_at` (or similar) to the admin order detail response** so the gate can also
pass when it's set. Direct/manual orders with no proposal history are unaffected (still need explicit
Order Confirmation acceptance).

### Marketing Contacts CSV Import — Column Name Clarification

Frontend normalises the CSV (BOM stripped, headers trimmed, mapped to snake_case) but all 188 rows are still `skipped_no_email`. The backend importer's expected header string for the email column is unknown. **Waiting on backend team to confirm the exact header name** (e.g. `email`, `Email`, `email_address`).

### Media Library (3 endpoints — backend confirmed built)

```
GET    /api/v1/admin/media?collection=&search=&per_page=
POST   /api/v1/admin/media        multipart: file, collection?, alt_text?
DELETE /api/v1/admin/media/{id}
```

Item shape: `{ id, filename, original_name, path, url, mime_type, size_bytes, width, height, alt_text, collection, created_at }`
Backend confirmed two bugs fixed (image-processing library API mismatch + `created_at` formatting 500). Frontend proxy routes and UI are live.

---

## Pending — Backend Contracts (legacy)

These frontend flows are complete. Backend endpoints are required to activate them.

### Customer Portal Notifications ("Email = Inbox")

Frontend complete (navbar bell + `/account/notifications` inbox + dashboard
recent-activity widget + email preferences). **Core principle: every transactional
email the backend sends a customer must also write a `customer_notifications` row
with the same subject/body** (set `email_sent_at`). Degrades to empty/0 until live.
**Full contract + table + triggers + dedupe: `docs/BACKEND-CUSTOMER-NOTIFICATIONS.md`.**

```
GET  /api/v1/auth/customer/notifications                filters: unread=1, type, severity, page, per_page
       returns: { data: CustomerNotification[], unread_count, meta }
GET  /api/v1/auth/customer/notifications/unread-count   returns: { unread_count }   (polled 30s — keep cheap)
POST /api/v1/auth/customer/notifications/{id}/read
POST /api/v1/auth/customer/notifications/{id}/dismiss
POST /api/v1/auth/customer/notifications/read-all

GET  /api/v1/auth/customer/notification-preferences     returns: { data: CustomerNotificationPreferences }
PUT  /api/v1/auth/customer/notification-preferences     body:    CustomerNotificationPreferences
```

Notification types: `order_placed`, `order_confirmation`, `order_confirmed`,
`payment_milestone`, `order_shipped`, `order_delivered`, `quote_received`,
`quote_ready`, `proposal_reminder`, `document_ready`, `account_approved`,
`access_request_update`, `verification_update`, `security_alert`, `welcome`,
`announcement`. Severities: `info`, `success`, `warning`, `urgent`. `action_url`
must be a relative portal path. Dedupe on `customer_id + type + related_type +
related_id + metadata->stage`; never duplicate an existing **unread** row.
`email_orders` + `security_alert` always email; `email_marketing` is opt-in.

### CRM-7 Proposal

```
POST /api/v1/admin/quote-requests/{id}/proposal/draft
POST /api/v1/admin/quote-requests/{id}/proposal/mark-ready
POST /api/v1/admin/quote-requests/{id}/proposal/send
POST /api/v1/admin/quote-requests/{id}/proposal/void       body: { reason? }

GET  /api/v1/proposals/{token}                             public — no auth
POST /api/v1/proposals/{token}/accept                      public
POST /api/v1/proposals/{token}/reject                      body: { reason? }
```

### CRM-7 Quote Items

```
GET    /api/v1/admin/quote-requests/{id}/items
POST   /api/v1/admin/quote-requests/{id}/items
PATCH  /api/v1/admin/quote-requests/{id}/items/{itemId}
DELETE /api/v1/admin/quote-requests/{id}/items/{itemId}
POST   /api/v1/admin/quote-requests/{id}/items/import-from-inquiry
```

### CRM-3B Admin Notifications & Work Queue

Frontend complete (bell + `/admin/notifications` + `/admin/my-work`). The bell polls
`unread-count` every 30s and fetches the list on open. Notification fields follow the
CRM-3B contract (`severity`, `body`, `action_url`, `related_type`/`related_id`); the
frontend also accepts the legacy `message`/`link` fields as fallbacks.

```
GET  /api/v1/admin/notifications              filters: unread=1, type, severity, page
       returns: { data: [{ id, type, title, body?, severity?, action_url?, related_type?,
                  related_id?, read_at?, dismissed_at?, metadata?, created_at }],
                  unread_count, meta }
GET  /api/v1/admin/notifications/unread-count returns: { unread_count }
POST /api/v1/admin/notifications/{id}/read
POST /api/v1/admin/notifications/{id}/dismiss
POST /api/v1/admin/notifications/read-all

GET  /api/v1/admin/my-work                    returns: { data: [{ type, title, subtitle?,
                  priority?, due_at?, action_url?, status? }] }
```

Notification types: `lead_assigned`, `follow_up_due`, `proposal_accepted`,
`customer_access_requested`, `customer_approval_needed`, `quote_needs_review`,
`order_payment_milestone`, `document_action_needed`. Severities: `info`, `success`,
`warning`, `urgent`.

Triggers (backend): lead assigned (on `POST /admin/quote-requests/{id}/assign`),
follow-up due (`admin:notifications:due-followups` scheduler), proposal accepted,
customer access requested, customer approval needed, quote needs review. Dedupe on
`type + related_type + related_id + date/stage`; never duplicate an existing **unread**
notification. The follow-ups list should honour a `mine=1` filter (used by the
"Assigned to me" tab).

### CRM-8 Buyer Lifecycle

```
GET  /api/v1/admin/customer-approvals          filters: status, verification_status, risk_level, buyer_tier, market_region, q
GET  /api/v1/admin/customers/{id}/timeline
POST /api/v1/admin/customers/{id}/approval-profile   body: { profile, notes? }
POST /api/v1/admin/customers/{id}/approve            body: { profile, buyer_tier?, notes? }
POST /api/v1/admin/customers/{id}/reject             body: { reason? }
POST /api/v1/admin/customers/{id}/set-tier           body: { buyer_tier, notes? }
POST /api/v1/admin/customers/{id}/risk               body: { risk_level, notes? }
GET  /api/v1/admin/customers/{id}/verifications
POST /api/v1/admin/customers/{id}/verifications      body: { type, value?, notes? }
PATCH /api/v1/admin/customers/{id}/verifications/{verificationId}   body: { status, notes? }
POST /api/v1/admin/customers/{id}/health/recalculate

GET  /api/v1/admin/customer-access-requests          filters: status, requested_access
POST /api/v1/admin/customer-access-requests/{id}/approve
POST /api/v1/admin/customer-access-requests/{id}/reject

GET  /api/v1/auth/customer/access-requests           customer — own requests
POST /api/v1/auth/customer/access-requests           customer — body: { requested_access, reason? }
```

### LANG-4 i18n Locale Resolution (geo auto-detection)

Frontend complete (`/api/i18n/detect` proxy + `LanguageProvider` first-visit detection).
The proxy reads the visitor country from CDN geo headers and resolves it via the backend
country→locale map. **No frontend blocker** — degrades to default-only (everyone `en`,
no auto-switch) until the routes go live.

```
GET /api/v1/i18n/locales              returns: { supported, default, country_locale }   🔧 built, needs deploy
GET /api/v1/i18n/resolve?country=XX   returns: { locale, country, source, is_default, supported }  (not used by FE — FE resolves from the cached map)
```

Frontend uses the **cached-map** style: fetches `/i18n/locales` once (server-side,
revalidate 1h, shared across visitors) and resolves `map[country] ?? default` itself,
so there is no per-request backend round trip and country geo stays server-side.
Wiring `LocaleResolver` into the content controllers is **not required** for this
integration (FE always sends `?locale=`); it's optional backend cleanup.

### CRM-6 Communications

```
GET  /api/v1/admin/crm/follow-ups
POST /api/v1/admin/crm/follow-ups/{id}/complete
POST /api/v1/admin/crm/follow-ups/{id}/reschedule
GET  /api/v1/admin/crm/email-templates
POST /api/v1/admin/quote-requests/{id}/send-follow-up-email
GET  /api/v1/admin/customers/{id}/communications
POST /api/v1/admin/customers/{id}/communications
GET  /api/v1/admin/quote-requests/{id}/communications
POST /api/v1/admin/quote-requests/{id}/communications
```

### DOC-6 Acceptance

```
POST /api/v1/admin/orders/{id}/acceptance/send
POST /api/v1/auth/orders/{ref}/reject-order-confirmation    body: { reason? }
```

### DOC-7/8 Payment Milestones

```
POST /api/v1/admin/orders/{id}/payments/mark-deposit-paid
POST /api/v1/admin/orders/{id}/payments/mark-balance-paid
POST /api/v1/admin/orders/{id}/payments/release-shipment
POST /api/v1/admin/orders/{id}/payments/resend-milestone-email   body: { stage }
```

### EB-1 eBay OAuth

```
GET  /api/v1/admin/ebay/auth-url
GET  /api/v1/admin/ebay/status
POST /api/v1/admin/ebay/disconnect
GET  /api/v1/admin/ebay/callback    → redirect to /admin/ebay?connected=1
```

### System Health

```
GET /api/v1/admin/system/health
GET /api/v1/admin/system/errors?limit=N
```

---

## Frontend Architecture Notes

- **GSAP only** — Framer Motion fully removed. All animations via `@/lib/gsap`.
- **No NextAuth** — custom cookie-based auth (`customer_token`, `admin_token`).
- **API proxy pattern** — all backend calls go through Next.js route handlers; browser never calls the Laravel API directly.
- **Server env var rule** — proxy routes use `process.env.API_URL` (private) first, then `NEXT_PUBLIC_API_URL` as fallback. Never use `NEXT_PUBLIC_API_URL` alone in server-side code.
- **Graceful degradation** — all features handle backend-not-deployed (404/405) with an inline message rather than a hard error.
- **TypeScript strict** — 0 errors enforced on every commit.

---

### ✅ UI Polish — Quick Wins (Phase 1)

| Feature | Commit | Notes |
|---|---|---|
| Global focus ring opacity bump | `0dd05c0` | `globals.css` override sets `--tw-ring-color` to 25% opacity for all inputs — covers all 63 files at once |
| Admin breadcrumbs on nested routes | `0dd05c0` | `getAdminBreadcrumb()` in admin-shell renders `Parent › Current` in topbar for any sub-route (e.g. Products › New, Orders › Detail) |
| Shared `EmptyState` component | `0dd05c0` | `components/ui/empty-state.tsx` — icon + heading + description + optional CTA; applied to admin orders & products tables |
| Filter sidebar chevron rotation | `0dd05c0` | Single `ChevronDown` rotates 180° on open (`transition-transform duration-200`) instead of swapping two icons |
| Form button heights standardised to 44px | `0dd05c0` | Customer account profile & addresses pages: `h-[46px]`/`py-3` → `h-11` |

---

### ✅ UI Polish — Homepage Redesign & Premium Pass (Phase 2)

A full senior-level UI/UX pass on the public homepage + admin shell, plus a
reusable polish layer. Light, blended, premium; Linear-inspired restraint.
All visual/motion only — no SEO meta/copy/alt/images disturbed; new visible
text routed through i18n (EN/DE/FR/ES, type-enforced).

| Feature | Commit | Notes |
|---|---|---|
| Admin sidebar — grouped sections + premium active state | `9372948` | Flat 25-item nav → 7 role-aware groups (Overview, Commerce, Customers & CRM, Content, Sales Channels, Insights, System); empty groups auto-hide; orange accent-bar active state; dropped redundant Profile row |
| Homepage spacing rhythm + card depth + dark REX band | `7385346` | `py-6` → `py-12 md:py-16`; flat `#efefef` cards get border + soft shadow + hover; REX converted to dark cinematic trust band |
| Platform Showcase — order-tracking UI mock | `db4b750`, `f81986d` | Rendered (non-screenshot) mock: floating app window, payment-milestone timeline (mirrors admin `PaymentMilestonesCard`), trade-doc rows; `t.platform` i18n; flex timeline (no dot/label overlap) |
| Hero redesign — "living" floating-UI cluster | `b2a6825`, `9e36027` | Replaced image slider with headline + CTAs + trust chips + floating product/search/shipment cards; **light blended** theme; section reorder (Hero → Brands → Categories → Who-We-Serve → Platform → Logistics → Tyre Highlights → Why → REX → FET → CTA). Old `Hero`/Hero-Slides CMS left intact (reversible) |
| Consolidated FET section | `9e36027` | 4 FET strips (teaser/ROI/verified/proof) → one premium `fet-showcase` with interactive Before/After video toggle (FET green system); homepage sections 14 → 11 |
| Interactive hero cards + global flag strip | `cc254bf`, `6b9b113` | Product card → `/shop?type=…`, working size search → `/shop?size=…` (normalised) with `?q=` fallback; featured search has typewriter placeholder + quick-pick chips; `GlobalReach` marquee of markets with Twemoji SVG flags (Windows-safe); `t.heroShowcase` + `t.globalReach` i18n |
| Hero ambient + tyre visuals | `7f6fbf9`, `230c98d` | Low-opacity animated background (counter-rotating tyre rings, flowing shipping-route arc, drifting glows, cursor-follow light); real spinning tyre (`mix-blend-multiply`) in product card + hero corner; tightened mobile hero |
| Ambient uniformity (platform section) | `6b9b113` | Platform section shares hero's rings/grid/glows; shared `TyreRing` component |
| FET promo card | `230c98d`, `6e6e042` | Appears on scroll-down, auto-dismisses (~6.5s, pauses on hover), once per session; FET green, bottom-left, `/fet` CTA |
| Interactive milestone timeline | `38d28e0` | Connectors "draw" downward on scroll, current step pulsing ring, hover-highlight rows (motion-safe) |
| Scroll-aware navbar | `77b843d` | Header gains subtle border + shadow + tighter bg once scrolled (no layout shift) |
| CTA micro-interaction system | `9a63f6a` | Hover-lift + tactile active-press on canonical buttons; reusable `.btn-cta` + behaviour-only `.cta-press` (applied to CTA section, platform, FET); animated footer-link underlines; hover-only + reduced-motion safe |
| Footer elevation | `9a63f6a` | Accent hairline + factual trust badges (ISO 9001:2015 · REX DEREX76000242) |
| `<SectionHeading>` system | `8e6d308` | One eyebrow + heading rhythm/type scale; adopted in Who-We-Serve & Categories |
| Scroll-progress bar | `8e6d308` | Thin top reading-progress indicator (rAF, transform-only, homepage) |
| Unified reveal cadence | `8e6d308` | CSS `FadeUp` aligned to GSAP `Reveal` (0.7s, ~`power3.out`) |

**New homepage components:** `home/hero-showcase`, `home/platform-showcase`, `home/fet-showcase`, `home/global-reach`, `home/fet-promo`, `home/scroll-progress`, `home/tyre-ring`, `ui/section-heading`.

**Open polish (optional):** roll `.cta-press` across remaining body CTAs · adopt `<SectionHeading>` in remaining sections · lighten REX band for full-light consistency · trim/merge WhyOkelcor · self-host flag SVGs (currently jsDelivr Twemoji) · wire flag strip to a live aggregated top-countries endpoint.

---

## Upcoming / Backlog

| Item | Priority | Notes |
|---|---|---|
| Marketing CSV import fix | High | Backend to clarify expected email column header name |
| Media Library backend activation | High | 3 endpoints confirmed built; two bugs fixed — ready to test |
| CRM-7 backend activation | High | 12 endpoints pending |
| CRM-8 backend activation | High | 14 endpoints + approve must flip `onboarding_status`/`is_active` & send approval email (see CRM-8 contract block) |
| CRM-3B notifications backend activation | High | `admin_notifications` table + service + 6 endpoints + `my-work` + triggers + dedupe + `due-followups` scheduler (see CRM-3B contract block) |
| Customer proposal view (account portal) | Medium | Show proposal status on account quotes |
| Proposal PDF document (AN number) | Medium | Backend to generate; frontend to display |
