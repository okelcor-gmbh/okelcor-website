# Backend Note — AI-Generated Admin Insights ("what's going on" popups)

**From:** Frontend · **Re:** automatic, natural-language insights on the admin dashboard
**Status:** Built end-to-end on both sides. Backend confirmed Gemini + a 15-minute
scheduled job (`insights:generate`), and frontend is wired to the exact shape shipped
(see "Backend response" below — reconciled 2026-07-18). **Not live in production yet**:
`GEMINI_API_KEY` isn't set on the server, so `GET /admin/insights` currently returns
`{ "data": [], "generated_at": null }` — the correct, expected empty state, not an
error. The moment that key is added, the topbar bell badge, dropdown, and popup toasts
start producing real data with zero further frontend or backend changes.

---

## The idea, in one sentence

Instead of an admin having to glance at several different dashboard cards and
mentally connect them, a small AI job periodically reads the same numbers the
dashboard already shows (revenue, orders, stock, security, quotes) and turns
them into a handful of short, plain-English observations — e.g.
*"Revenue is up 34% vs yesterday, driven mostly by 3 large TBR orders from
Germany"* or *"Michelin 295/80R22.5 will likely stock out within ~4 days at
the current order pace."* The frontend surfaces these as a small popup/toast
plus a lightweight history panel — noticeably more engaging than another
static number, and it's the one thing on the dashboard an admin doesn't have
to build in their head themselves.

This is **not** a new data source — it's a summarization layer on top of data
the `/admin/dashboard` endpoint (and the existing security/analytics
endpoints) already returns.

---

## Which AI API — genuinely free, not a free trial

Recommendation: **Google Gemini API** (Gemini 2.0/1.5 Flash) via Google AI
Studio. It has a standing free tier — no credit card, no expiring trial
credit, rate-limited but renewing daily — and supports structured/JSON-mode
output, which matters here: we want a predictable schema back, not prose the
backend has to parse with regex.

Fallback if Gemini's free-tier rate limit is ever a problem: **Groq**
(Llama 3.3 70B or similar) — also a standing free tier, very fast, good
open-model alternative. Both should be verified against their current
published terms at integration time since free-tier limits do shift over
time; whichever is picked, the job should degrade silently (skip that cycle,
keep serving the last cached insights) rather than error if a quota is ever
hit — same graceful-degradation approach used everywhere else in this app.

**Explicitly not recommended:** OpenAI and Anthropic's own APIs — neither has
a standing free tier, only an expiring trial credit on signup, which doesn't
fit "free" as asked.

---

## Why this has to be a backend job, not a frontend call

1. API keys can't live in the browser.
2. This should run **once, on a schedule** (e.g. every 10–15 minutes),
   cached, and served instantly to however many admins are looking at the
   dashboard at once — not regenerated per page load. Calling the AI API per
   admin per page view would burn through a free-tier budget in minutes with
   more than a couple of admins online.
3. Data minimization: the prompt sent to the AI should only ever contain
   **aggregate numbers and category labels** ("3 orders from Germany worth
   €3,200 total," "12 failed logins from 2 IPs in the last hour") — never
   raw customer names, emails, or addresses. Everything already aggregated
   for the existing dashboard stats/security-summary endpoints is fine to
   summarize; individual customer records are not.

---

## Shipped contract (final — matches what's actually deployed)

```
GET /admin/insights
```

```jsonc
{
  "data": [
    {
      "id": "ins_20260718_090000_01",
      "category": "revenue",        // revenue | orders | inventory | security | quotes — no "traffic" (see below)
      "severity": "positive",       // positive | info | warning | critical
      "headline": "Revenue up 34% vs yesterday",
      "detail": "Driven mostly by 3 large TBR orders from Germany.",
      "action_url": null           // string when a deep link makes sense, otherwise null
    }
  ],
  "generated_at": "2026-07-18T09:00:00Z",
  "next_refresh_at": "2026-07-18T09:15:00Z"
}
```

Two things proposed earlier were **not** built and have been removed from the
frontend to match: a `**bold**` markdown-lite span in `detail`, and an
optional `suggestion` field. Neither shipped — `detail` is plain text and
there's no suggestion field. If either is wanted later it's a small additive
change on both sides, not a redesign.

No dismiss endpoint — the frontend tracks "seen"/dismissed insight IDs
client-side (localStorage). No history/pagination endpoint either — backend
does persist every 15-minute batch in a real table on their side, so a
history endpoint is a small future addition if a proper history panel (not
just locally-tracked seen IDs) is ever wanted.

`data: []` / `generated_at: null` is the correct, expected state whenever
`GEMINI_API_KEY` isn't set — not an error, and exactly what ships in
production until that key is added.

---

## Source data per category (backend-confirmed, final)

| Category | What it actually summarizes |
|---|---|
| Revenue / Orders | Today vs. yesterday revenue and order count, today's paid orders broken down by country and by tyre type (PCR/TBR/Used/OTR) |
| Inventory | A real backend-computed stockout forecast (`current stock ÷ 7-day daily sell-through`) for any product within 10 days of stockout — Gemini restates this number in plain English, it never invents it |
| Security | Today's failed logins, critical security events, permission-denied events, overall 2FA adoption rate |
| Quotes | Today's new quote count, total open quotes, today's breakdown by tyre category |

**Traffic was dropped** — there's no PostHog integration on the Laravel side
(analytics live entirely frontend-embedded), so there's no aggregate traffic
data to feed this today. A separate proposal (PostHog personal API key + a
new backend query layer) would be needed to add it back — not blocking this
feature, noted for later.

---

## What frontend has built

`components/admin/insights-bell.tsx` — a distinct topbar bell (sparkle icon,
own identity, not reused notification-bell styling) that:
- Polls `/api/admin/insights` every 2 minutes.
- Shows a badge + dropdown of current insights (severity-tinted icon chip,
  category label, headline, detail, optional deep link, per-item dismiss +
  "Clear all").
- Slides in up to 2 popup toasts (top-right, auto-dismiss ~9s) for any
  insight not already seen in this browser (tracked in `localStorage`, so a
  given insight only ever toasts once per admin).

Fully wired into `components/admin/admin-shell.tsx`, reconciled against the
shipped contract above (category list trimmed to 5, `suggestion`/bold-span
handling removed since neither exists). Nothing left to do frontend-side —
it'll start rendering the moment `GEMINI_API_KEY` is set.

---

## Backend response (2026-07-18) — resolved

- **Provider: Gemini**, confirmed — same free-tier reasoning as proposed.
- **Scheduled job, confirmed** — `insights:generate` runs every 15 minutes
  via Laravel's scheduler, independent of admin headcount.
- **Data minimization: confirmed** — aggregates only, no customer/admin
  names, emails, or addresses ever leave the server.
- **Blocker to real output:** `GEMINI_API_KEY` not yet set in production.
  Everything else (scheduled job, database table, endpoint) is live.
