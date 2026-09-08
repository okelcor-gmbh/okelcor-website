# Okelcor Admin — Design Guide ("the operations console")

Researched 2026-09-08 against the consoles the industry holds up as the
standard, then chosen deliberately for Okelcor. This is the direction
every admin page converges on as it is touched. See PROGRESS.md
(session 127) for the research sources.

## The references, and what we take from each

| Reference | What we adopt |
|---|---|
| **Stripe Dashboard** | The table is the truth; the chart is a summary. Right-aligned tabular numerals. Colour carries *meaning only* — red means broken, never "look here". One metric leads a page, top-left. |
| **Linear** | Calm beats dense. Low chrome, generous whitespace, sub-second interactions, the work surface gets the pixels. Progressive disclosure over walls of data. |
| **Raycast / Vercel** | The near-black rail with a single accent — already Okelcor's signature (`#101216`, matching the login), kept and refined rather than replaced with a template-white sidebar. |
| **Shopify Polaris** | Density where the work is dense: index tables tight, hairline dividers, surface colour (not borders) to create zones. |

## The rules

1. **One orange.** `#f4511e` (hover `#df4618`). It marks the brand, active
   states and primary actions — never status. Status colours are
   semantic: emerald = healthy/paid, amber = waiting, red = broken/loss.
2. **Console radii.** Panels/cards `rounded-xl` (12px), inputs
   `rounded-lg`/`rounded-xl`, pills (`rounded-full`) only for buttons,
   badges and filters. No `rounded-2xl`+ bubbles in the admin.
3. **Hairlines over shadows.** `ring-1 ring-black/[0.06]` (or
   `border-black/[0.06]`) + at most `shadow-sm`. Heavy shadows are for
   floating layers only (dropdowns, modals).
4. **One canvas.** The shell paints `#f6f7f9` and caps content at
   1600px; pages never set their own background.
5. **The rail.** `#101216`, 256px (64px collapsed), inverted wordmark,
   role chip, filter + ⌘K, groups foldable, items gated by
   `canAccessSection` — always.
6. **Headers.** Every page starts with `<PageHeader eyebrow title sub>`
   (eyebrow = section, brand orange, tracked caps) with actions in the
   right slot.
7. **Tables.** Dense rows, uppercase tracked `th`, tabular numerals
   right-aligned for money, wide tables scroll inside their own
   `overflow-x-auto` — the page never scrolls horizontally.
8. **Tell the team.** Every shipped feature adds its entry to
   `lib/whats-new.ts` in the same commit.

## Applying it

New pages follow all rules from day one. Existing pages: the radius,
canvas and orange sweeps are already done panel-wide; adopt `PageHeader`
and the table rules whenever a page is touched for any other reason.
