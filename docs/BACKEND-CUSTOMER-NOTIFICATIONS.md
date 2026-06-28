# Backend Contract — Customer Portal Notifications ("Email = Inbox")

**Status:** Frontend complete · Backend pending
**Owner:** Backend team
**Frontend ref commits:** customer notification engine + inbox + dashboard activity

---

## 1. The core idea (read this first)

The customer portal now has an **in-app notification inbox** that mirrors the
customer's transactional email. The product principle is one sentence:

> **Every transactional email we send a customer must ALSO create a
> `customer_notifications` row with the same subject and summary.**

So when the backend sends "Your deposit has been received" by Resend, it also
writes a notification row. The customer then sees that same message in the bell
dropdown (navbar) and in `/account/notifications` — they never have to dig
through their email to track an order.

This is the customer-facing twin of the admin CRM-3B notification system.

The frontend is **fully built and live behind graceful degradation**: until
these endpoints exist, the bell shows 0 and the inbox shows an empty state — no
errors. The moment the endpoints return data, everything lights up. No frontend
deploy is required to activate.

---

## 2. What the frontend already does

| Piece | Path |
|---|---|
| Navbar bell (unread badge, 30s poll, dropdown) | `components/account/notification-bell.tsx` |
| Full inbox center (filters, pagination, preferences) | `components/account/notifications-center.tsx` |
| Inbox page | `app/account/notifications/page.tsx` |
| Dashboard "Recent activity" widget | `components/account/activity-preview.tsx` |
| Account-status card (verification + B2B access) | `app/account/page.tsx` |
| Model + UI helpers | `lib/customer-notifications.ts` |
| Proxy routes (browser → these) | `app/api/account/notifications/**` |

All browser calls go through Next.js proxy routes (the standard pattern — the
browser never calls Laravel directly). The proxies attach the `customer_token`
cookie as `Authorization: Bearer …` and forward to the backend paths below.

---

## 3. Endpoints to build

All are **customer-scoped** (authenticated by the customer bearer token) and must
only ever return/affect the **signed-in customer's own** notifications.

### 3.1 List

```
GET /api/v1/auth/customer/notifications
    query: unread=1 | type=<type> | severity=<sev> | page=<n> | per_page=<n>

200 {
  "data": [ CustomerNotification, … ],   // newest first; excludes dismissed
  "unread_count": 3,
  "meta": { "current_page": 1, "last_page": 4, "per_page": 15, "total": 52 }
}
```

`per_page` defaults to 15. The bell requests `per_page=8`; the dashboard widget
requests `per_page=4`; the inbox paginates with `page`.

### 3.2 Unread count (lightweight — polled every 30s)

```
GET  /api/v1/auth/customer/notifications/unread-count
200  { "unread_count": 3 }
```

Keep this cheap — it is polled by every signed-in tab. A single indexed
`COUNT(*) WHERE customer_id = ? AND read_at IS NULL AND dismissed_at IS NULL`.

### 3.3 Mark one read

```
POST /api/v1/auth/customer/notifications/{id}/read
200  { "ok": true }            // sets read_at = now() if currently unread
```

### 3.4 Mark all read

```
POST /api/v1/auth/customer/notifications/read-all
200  { "ok": true }            // read_at = now() for all the customer's unread
```

### 3.5 Dismiss (hide from inbox)

```
POST /api/v1/auth/customer/notifications/{id}/dismiss
200  { "ok": true }            // sets dismissed_at = now(); excluded from lists
```

### 3.6 Preferences (email/in-app delivery toggles)

```
GET /api/v1/auth/customer/notification-preferences
200 { "data": CustomerNotificationPreferences }

PUT /api/v1/auth/customer/notification-preferences
    body: CustomerNotificationPreferences (partial allowed)
200 { "data": CustomerNotificationPreferences }
```

`CustomerNotificationPreferences`:

```jsonc
{
  "inapp_enabled":   true,   // master switch for the in-app inbox
  "email_enabled":   true,   // master switch for transactional email
  "email_orders":    true,   // orders, payments, shipping, delivery  (KEEP FORCED ON)
  "email_documents": true,   // invoices, packing lists, shipment docs
  "email_quotes":    true,   // quote/proposal updates
  "email_account":   true,   // approvals, access requests, security
  "email_marketing": false   // news, promotions, announcements
}
```

> **Compliance note:** `email_orders` (and security alerts) are operational/legal
> communications and must stay forced on — the UI renders that toggle locked.
> `email_marketing` must default **off** (opt-in) for GDPR.

---

## 4. The `CustomerNotification` shape

```jsonc
{
  "id": 1024,
  "type": "payment_milestone",          // see enum below; unknown values tolerated
  "title": "Deposit received for order AB-1042",   // == email subject
  "body":  "We've received your 30% deposit. We'll prepare your shipment next.", // == email summary
  "severity": "success",                // info | success | warning | urgent
  "action_url": "/account/orders/AB-1042",   // in-app deep link (relative path)
  "related_type": "order",              // order | quote_request | proposal | trade_document | access_request | verification | account
  "related_id": "AB-1042",
  "read_at": null,                      // ISO 8601 or null
  "dismissed_at": null,                 // ISO 8601 or null
  "email_sent_at": "2026-06-28T10:15:00Z",  // set when ALSO emailed → drives the "Emailed" tag
  "metadata": { "stage": "deposit" },   // optional, type-specific
  "created_at": "2026-06-28T10:15:00Z"
}
```

Field notes:
- **`title`/`body` must match the email** subject/summary. That equivalence is the
  whole feature. Keep `body` to ~1–2 sentences (it's a preview, not the full email).
- **`action_url`** must be a **relative** in-app path (e.g. `/account/orders/AB-1042`,
  `/account/quotes/Q-77`, `/account/invoices`). Never an absolute/external URL.
- **`email_sent_at`** — set it whenever the same event was emailed. If a
  notification is in-app only (e.g. a soft nudge), leave it null.
- **`severity`** drives colour. Suggested mapping in §6.

### `type` enum (frontend has icons + labels for each; new values fall back gracefully)

| type | when | severity | example title |
|---|---|---|---|
| `order_placed` | order received / confirmation email | success | "Order AB-1042 received" |
| `order_confirmation` | Order Confirmation (AB) issued, awaiting acceptance | warning | "Please confirm order AB-1042" |
| `order_confirmed` | customer accepted / order confirmed | success | "Order AB-1042 confirmed" |
| `payment_milestone` | deposit/balance due or received, shipment released | success/warning | "Deposit received for AB-1042" |
| `order_shipped` | shipment dispatched + tracking | info | "Your order has shipped" |
| `order_delivered` | delivery confirmation | success | "Order AB-1042 delivered" |
| `quote_received` | quote request received | info | "We received your quote request" |
| `quote_ready` | proposal sent / quote ready | success | "Your quote is ready" |
| `proposal_reminder` | pending proposal reminder | warning | "Your proposal expires soon" |
| `document_ready` | invoice / packing list / commercial invoice available | info | "Invoice INV-2031 is ready" |
| `account_approved` | B2B onboarding approved | success | "Your account has been approved" |
| `access_request_update` | access request approved/rejected | success/warning | "Wholesale pricing access approved" |
| `verification_update` | verification added/approved/rejected | info | "Your VAT number was verified" |
| `security_alert` | password changed, new sign-in | urgent | "Your password was changed" |
| `welcome` | welcome / email verified | info | "Welcome to Okelcor" |
| `announcement` | general announcement / campaign | info | "New winter range available" |

The frontend tolerates unknown `type` strings (renders a default bell icon +
"Notification" label), so the backend can add categories without a FE deploy.

---

## 5. Where to create notifications (triggers)

Wherever a customer email is sent today, add a notification write. Suggested map
to existing flows already documented in `PROGRESS.md`:

| Existing email / event | Notification type | related_type |
|---|---|---|
| DOC-1 Order Confirmation (AB) issued | `order_confirmation` | order |
| DOC-6 acceptance request / accepted | `order_confirmation` / `order_confirmed` | order |
| DOC-7/8 payment milestone emails (deposit/balance/shipment) | `payment_milestone` | order |
| Shipment dispatched | `order_shipped` | order |
| Delivery confirmed | `order_delivered` | order |
| Trade doc generated/sent (invoice, packing list, commercial invoice) | `document_ready` | trade_document |
| Quote request received | `quote_received` | quote_request |
| CRM-7 proposal sent / ready | `quote_ready` | proposal |
| CRM-7 proposal reminder | `proposal_reminder` | proposal |
| CRM-1/CRM-8 onboarding approved | `account_approved` | account |
| CRM-8 access request approved/rejected | `access_request_update` | access_request |
| CRM-8 verification status change | `verification_update` | verification |
| Password changed / new device sign-in | `security_alert` | account |
| Registration / email verified | `welcome` | account |

**Recommended implementation:** a single `CustomerNotifier::send($customer, $type,
$payload)` service that (a) renders + sends the Resend email and (b) writes the
notification row in one place, so subject/body can't drift apart. Have the mailer
return the send timestamp and store it as `email_sent_at`.

### Dedupe
Don't create a second **unread** notification for the same logical event. Dedupe on
`customer_id + type + related_type + related_id + metadata->stage` (mirror the
admin CRM-3B dedupe rule). Resending an email may update `email_sent_at` but
should not spawn a duplicate unread row.

### Preferences gating
- If `inapp_enabled = false`, still create rows but the count can exclude them —
  simplest is to keep creating rows (history) and let the customer dismiss.
  (Recommended: always create in-app rows; preferences only gate **email**.)
- Email send must respect the per-group `email_*` flag, **except** `email_orders`
  and `security_alert`, which always send.

---

## 6. Suggested `severity` mapping

| Situation | severity |
|---|---|
| Action required by the customer (confirm order, payment due, proposal expiring) | `warning` |
| Security-sensitive (password changed, new sign-in) | `urgent` |
| Positive completion (received, approved, delivered, confirmed) | `success` |
| FYI (shipped, document ready, welcome, announcement) | `info` |

---

## 7. Suggested table

```sql
CREATE TABLE customer_notifications (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id   BIGINT NOT NULL,
  type          VARCHAR(48) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  body          TEXT NULL,
  severity      VARCHAR(16) NOT NULL DEFAULT 'info',
  action_url    VARCHAR(512) NULL,
  related_type  VARCHAR(48) NULL,
  related_id    VARCHAR(64) NULL,
  read_at       TIMESTAMP NULL,
  dismissed_at  TIMESTAMP NULL,
  email_sent_at TIMESTAMP NULL,
  metadata      JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cust_unread (customer_id, read_at, dismissed_at),
  INDEX idx_cust_created (customer_id, created_at),
  INDEX idx_dedupe (customer_id, type, related_type, related_id)
);

-- Preferences: a JSON column on customers, or a dedicated table.
ALTER TABLE customers
  ADD COLUMN notification_preferences JSON NULL;  -- shape = CustomerNotificationPreferences
```

---

## 8. Acceptance checklist

- [ ] `customer_notifications` table + `notification_preferences` storage
- [ ] 5 notification endpoints + 2 preferences endpoints (§3)
- [ ] List excludes dismissed; newest first; correct `unread_count`
- [ ] All endpoints strictly scoped to the authenticated customer
- [ ] `CustomerNotifier` service writes a row for every customer email, with
      matching `title`/`body` and `email_sent_at`
- [ ] Dedupe prevents duplicate unread rows for the same event
- [ ] `email_orders` + `security_alert` always email; `email_marketing` opt-in
- [ ] `action_url` values are valid relative portal paths

---

## 9. Out of scope here (separate future tasks)

- **i18n of the account area.** The customer portal (`/account/**`) is currently
  English-only by existing convention (it doesn't use the i18n client context,
  unlike the public marketing pages). The new notification UI matches that.
  Localising the whole account area — including notification `title`/`body`, which
  should follow the customer's `locale` — is a separate effort. When done, the
  backend should render notification copy in the customer's stored locale.
- Real-time push (websockets) — current design is 30s polling, which is plenty.
