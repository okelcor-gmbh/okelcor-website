# Backend Note — Premium UX Pass (competitive research)

**From:** Frontend · **Re:** shop/catalogue trust & UX
**Status:** Two features shipped with zero backend dependency (below). The
rest needs backend data we don't have today — this is the ask.

---

## Why this exists

Did a competitive pass against three real tyre platforms to find UX gaps
worth closing for a premium first impression:

- **Tire Rack** — rigorous fitment-accuracy engineering, strong filtering,
  a side-by-side comparison tool, excellent mobile UX.
- **SimpleTire** — typeahead search, climate/region-aware merchandising,
  trust badges ("Best Seller", "Most Trusted"), install-location picker.
- **ATD / ATDOnline** (B2B distributor) — real-time multi-warehouse stock,
  one-click reorder, saved quotes, account balance, same/next-day delivery
  flags. This is the closest business-model match to Okelcor.

Good news checked first: Okelcor's Cmd+K live search
(`components/search/search-modal.tsx`) already matches or beats SimpleTire's
typeahead — real-time results, keyboard nav, product+article grouping. Not
touched, nothing to fix there.

---

## Shipped — no backend needed

| Feature | What it is | Where |
|---|---|---|
| **Tyre comparison tool** | Select up to 4 products anywhere in the catalogue (a small "Compare" toggle on each card), a floating bar tracks the selection, and a modal shows brand/size/spec/season/type/price/availability side by side. Persisted to `localStorage` so it survives navigation. | `context/compare-context.tsx`, `components/shop/compare-bar.tsx`, `components/shop/compare-modal.tsx` |
| **Trust signal upgrade** | Product card and detail page now show a real "✓ In Stock" confidence line (derived from the existing `in_stock` flag) instead of only flagging the negative case. Detail page also surfaces the site's actual certifications (ISO 9001:2015, REX · DEREX76000242 — same facts already in the footer) plus a "Quality Inspected" badge at the point of decision, not just in the footer where they get missed. | `components/shop/product-card.tsx`, `components/shop/product-info.tsx` |

Both are honest about what we can currently prove: the trust badges only
restate certifications the business already holds, and the stock line only
reflects the existing boolean — no new claims invented. The next section is
what would make these genuinely richer instead of just better-presented.

---

## Needed from backend, in priority order

### 1. Real per-warehouse stock + delivery ETA (highest impact)

This is ATD's single strongest trust lever and Okelcor's biggest visible
gap: today `Product.in_stock` is a bare boolean, so the best we can honestly
say is "In Stock" — no quantity, no location, no ETA.

```jsonc
// Addition to GET /products, GET /products/{id}
{
  "stock_quantity": 24,
  "stock_locations": [
    { "warehouse": "Hamburg", "quantity": 16 },
    { "warehouse": "Rotterdam", "quantity": 8 }
  ],
  "estimated_dispatch_days": 2   // realistic, order-manager-approved number — do not invent one FE-side
}
```

With this we can show "24 in stock · ships in ~2 days" instead of a flat
badge — directly the ATDOnline pattern, and the single change most likely to
make a first-time B2B buyer trust the checkout.

### 2. Tyre batch/condition traceability (used, PCR, TBR listings)

Okelcor's actual differentiator vs. all three competitors: none of them sell
graded used tyres, so none of them solve this, but it's exactly what a buyer
of used stock needs to feel safe. Suggest a `tyre_batch` object per product:

```jsonc
{
  "condition_grade": "A",              // whatever grading scale ops already uses
  "tread_depth_mm": 6.5,
  "dot_code": "2419",                  // manufacture week/year
  "inspection_date": "2026-06-30",
  "inspection_photos": ["https://...", "https://..."]
}
```

Frontend would render this as a "Tyre Passport" card on the product page —
photos, grade, tread depth, inspection date — right next to the trust badges
already shipped. If this data doesn't exist in the ops workflow today, flag
it back; it's the one feature here that's a genuinely new capability rather
than surfacing existing data.

### 3. Saved fitments / one-click reorder

TireRack's "My Garage" and ATD's one-click reorder, adapted for B2B repeat
buyers: let a customer save a size/vehicle profile and reorder a past order's
exact line items without re-entering anything.

```
GET/POST/DELETE /auth/customer/saved-fitments     { size, brand?, label? }
POST /auth/orders/{ref}/reorder                    → new order/cart pre-filled with the same items at current prices
```

`reorder` should re-price at today's rates rather than replaying the old
order's prices verbatim — the whole point is convenience, not a stale quote.

### 4. (Low priority, only if catalogue grows) search-suggest endpoint

Current search already runs well against the loaded catalogue client-side.
Only worth a dedicated `/search/suggest?q=` endpoint if the product count
grows large enough that client-side matching gets slow — not needed now,
noting it so it's not forgotten if that changes.

---

## Please scan / confirm

- Confirm `estimated_dispatch_days` (or whatever ETA field) reflects a real,
  order-manager-approved number per warehouse — frontend will display
  whatever is sent verbatim and won't fabricate a delivery promise.
- Confirm whether tyre condition/batch data (§2) already exists anywhere in
  the ops/inventory system, or would need new data entry — changes the
  scope significantly.
- Saved fitments (§3) is the lowest-risk of the three — plain CRUD, no
  pricing logic beyond the reorder endpoint itself.
