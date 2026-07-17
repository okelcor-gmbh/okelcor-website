# Backend Note — AI-Generated Admin Insights ("what's going on" popups)

**From:** Frontend · **Re:** automatic, natural-language insights on the admin dashboard
**Status:** Frontend is fully built against this contract and live behind graceful
degradation — `GET /api/admin/insights` currently returns an empty list, so nothing
renders yet. The moment the endpoint below returns real data, the topbar bell badge,
dropdown, and popup toasts all light up. No frontend deploy needed to activate.

---

## The idea, in one sentence

Instead of an admin having to glance at six different dashboard cards and
mentally connect them, a small AI job periodically reads the same numbers the
dashboard already shows (revenue, orders, stock, security, traffic, quotes)
and turns them into a handful of short, plain-English observations — e.g.
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

## Proposed contract

```
GET /admin/insights
```

```jsonc
{
  "data": [
    {
      "id": "ins_20260718_0900_01",
      "category": "revenue",        // revenue | orders | inventory | security | traffic | quotes
      "severity": "positive",       // positive | info | warning | critical
      "headline": "Revenue up 34% vs yesterday",
      "detail": "Driven mostly by **3 large TBR orders from Germany** (avg. €1,240 each).",
      "suggestion": null,           // optional — see note below
      "action_url": "/admin/orders?..."   // optional deep link, omit if none makes sense
    }
  ],
  "generated_at": "2026-07-18T09:00:00Z",
  "next_refresh_at": "2026-07-18T09:15:00Z"
}
```

Two small additions since the frontend got built out:

- **`detail` supports one `**bold**` span** — wrap the single most important
  clause in double-asterisks (plain markdown-lite, nothing fancier) and the
  frontend renders it as emphasized text. Don't bold more than one clause per
  sentence — this is meant to draw the eye to the one number/fact that
  matters, not to format the whole sentence.
- **`suggestion`** (optional, nullable) — a short, separate, actionable
  one-liner distinct from `detail`'s observation, e.g. *"3 quotes have sat
  unassigned for 2+ days — assigning them now would clear most of the
  backlog."* Rendered as a small distinct callout in the dropdown (not the
  popup toast, which stays compact). Omit or send `null` when there's nothing
  actionable to add — not every insight needs one.

That's the only endpoint needed. No dismiss endpoint required — the frontend
tracks "seen"/dismissed insight IDs client-side (localStorage), so dismissing
one just hides it locally until the next generation cycle produces new ones.

Degrades the same way every other optional integration in this app does:
`data: []` (or a 404/501) until it's live — frontend shows nothing, no error.

---

## Suggested source data per category (all already computed today)

| Category | Already-existing source |
|---|---|
| Revenue / Orders | Same orders data behind `/admin/dashboard` (`revenue_today`, `orders_today_paid`, etc.) |
| Inventory | Product `inventory` counts (same data behind the dashboard's low-stock list) |
| Security | `/admin/security/summary` (locked accounts, failed attempts, suspicious accounts) |
| Traffic | Whatever already feeds the PostHog-backed analytics cards (active sessions, top pages, traffic sources) |
| Quotes | Open/new quote-request counts and categories |

A 3–5 sentence-max prompt per cycle, feeding this condensed snapshot in and
asking for 2–4 ranked insight objects back (most important first, capped so
the popup never becomes a wall of text) is enough — this doesn't need
conversation memory or multi-turn reasoning, just one summarization call per
refresh cycle.

---

## What frontend has already built

`components/admin/insights-bell.tsx` — a distinct topbar bell (sparkle icon,
own identity, not reused notification-bell styling) that:
- Polls `/api/admin/insights` every 2 minutes.
- Shows a badge + dropdown of current insights (severity-tinted icon chip,
  category label, headline, detail, optional suggestion callout, optional
  deep link, per-item dismiss + "Clear all").
- Slides in up to 2 popup toasts (top-right, auto-dismiss ~9s) for any
  insight not already seen in this browser (tracked in `localStorage`, so a
  given insight only ever toasts once per admin).

Fully wired into `components/admin/admin-shell.tsx`. Nothing to do
frontend-side once the endpoint ships — it'll just start rendering.

---

## Please confirm

- Comfortable running a scheduled job (cron/queue, whatever's idiomatic on
  the Laravel side) rather than generating on-demand per request — this is
  the part that keeps it inside a free tier's rate limits regardless of
  admin headcount.
- Gemini vs. Groq — either is fine frontend-side, this is purely a backend
  cost/ops call; just flag which one so this note can be updated.
- Comfortable with the data-minimization rule above (aggregates only, no raw
  PII in the prompt) — non-negotiable given this is an EU B2B company, but
  worth an explicit yes before anything's wired up.
