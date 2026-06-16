# Okelcor Website — Progress Tracker

**Last updated:** 2026-06-16  
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
| Backend | Laravel API — `https://api.okelcor.de/api/v1` |

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
| CRM-4 — Customer segmentation & access control | `cc2cab5` | ✅ Complete |
| CRM-5 — Customer data quality & deduplication | `62850bc` | ✅ Complete |
| CRM-6 — Communication timeline & follow-up automation | `6fd6f58` | ✅ Complete |
| CRM-7 — Proposal management & customer acceptance | `224ab1c` | ✅ Frontend complete |
| CRM-8 — Buyer approval & customer lifecycle | `8c85cc0` | ✅ Frontend complete |

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
| Backend endpoints (7 routes) | — | ⏳ Backend team |
| Quote items backend (5 routes) | — | ⏳ Backend team |

---

## Pending — Backend Contracts

These frontend flows are complete. Backend endpoints are required to activate them.

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

### CRM-3 Admin Notifications

Bell icon + dropdown panel in the admin topbar (`components/admin/notifications-bell.tsx`),
polling every 30s for unread count. Currently used for "lead assigned to you" but the
`type`/`link` fields are generic enough to reuse for other events (follow-up due,
proposal accepted, etc.).

```
GET  /api/v1/admin/notifications                returns: { data: [{ id, type, title, message?, link?, read_at?, created_at }], unread_count }
POST /api/v1/admin/notifications/{id}/read
POST /api/v1/admin/notifications/read-all
```

Trigger: when `POST /admin/quote-requests/{id}/assign` changes `assigned_to` to a
new user, create a `lead_assigned` notification for that user with a `link` to
`/admin/quotes/{id}`.

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

### CRM-3 Admin Notifications

```
GET  /api/v1/admin/notifications                returns: { data: [{ id, type, title, message?, link?, read_at?, created_at }], unread_count }
POST /api/v1/admin/notifications/{id}/read
POST /api/v1/admin/notifications/read-all
```

Plus: on assign (`POST /admin/quote-requests/{id}/assign`), create a `lead_assigned`
notification for the newly assigned user, linking to `/admin/quotes/{id}`.

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

## Upcoming / Backlog

| Item | Priority | Notes |
|---|---|---|
| CRM-7 backend activation | High | 12 endpoints pending |
| CRM-8 backend activation | High | 14 endpoints + approve must flip `onboarding_status`/`is_active` & send approval email (see CRM-8 contract block) |
| CRM-3 notifications backend activation | Medium | 3 endpoints + trigger on lead assignment (see CRM-3 Admin Notifications contract block) |
| Customer proposal view (account portal) | Medium | Show proposal status on account quotes |
| Proposal PDF document (AN number) | Medium | Backend to generate; frontend to display |
