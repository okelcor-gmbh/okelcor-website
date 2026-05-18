/**
 * lib/ebay.ts — QUARANTINED: Legacy Trading API (XML/SOAP)
 *
 * NOT used by any seller listing, remove, or sync action.
 * All seller operations now route through the Laravel backend
 * (EbaySellingService + DB-backed OAuth tokens via ebay_tokens table).
 *
 * Route handlers and server actions that previously imported from here
 * have been replaced with direct proxies to the Laravel Sell API:
 *   POST   /api/v1/admin/products/{id}/ebay/list
 *   DELETE /api/v1/admin/products/{id}/ebay/remove
 *   PATCH  /api/v1/admin/products/{id}/ebay/update
 *   POST   /api/v1/admin/products/{id}/ebay/refresh-status
 *   GET    /api/v1/admin/ebay/sync
 *
 * This file is retained for reference only. Do NOT re-import its
 * listProductOnEbay / removeProductFromEbay / getActiveListings
 * functions into any production listing flow — they use the stale
 * EBAY_ACCESS_TOKEN env var which produces error 932 (token expired).
 */

const TRADING_API_URL = "https://api.ebay.com/ws/api.dll";
const TRADING_COMPAT_LEVEL = "967";
const EBAY_SITE_ID_DE = "77";
const TYRE_CATEGORY_ID = "33743";
const TOKEN_REFRESH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SELL_SCOPES = [
  "https://api.ebay.com/oauth/api_scope/sell.item",
  "https://api.ebay.com/oauth/api_scope/sell.item.draft",
].join(" ");

// ── Module-level token cache ───────────────────────────────────────────────────
// Lives for the duration of the serverless function instance.
// Worst case: each cold start does one extra refresh call.
let _cachedToken: { value: string; expiresAt: number } | null = null;

// ── Env helpers ───────────────────────────────────────────────────────────────

function env() {
  return {
    appId:         process.env.EBAY_APP_ID        ?? "",
    devId:         process.env.EBAY_DEV_ID         ?? "",
    certId:        process.env.EBAY_CERT_ID        ?? "",
    accessToken:   process.env.EBAY_ACCESS_TOKEN   ?? "",
    refreshToken:  process.env.EBAY_REFRESH_TOKEN,
    postalCode:    process.env.EBAY_SELLER_POSTAL_CODE ?? "",
    location:      process.env.EBAY_SELLER_LOCATION    ?? "Germany",
    shippingCost:  process.env.EBAY_SHIPPING_COST      ?? "5.99",
    defaultQty:    parseInt(process.env.EBAY_DEFAULT_QUANTITY ?? "4", 10),
  };
}

export function isEbayConfigured(): boolean {
  const e = env();
  return !!(e.appId && e.certId && e.accessToken);
}

// ── Token management ──────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const e = env();

  if (_cachedToken && Date.now() < _cachedToken.expiresAt - 120_000) {
    return _cachedToken.value;
  }

  if (e.refreshToken && e.appId && e.certId) {
    const credentials = Buffer.from(`${e.appId}:${e.certId}`).toString("base64");
    try {
      const res = await fetch(TOKEN_REFRESH_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type:    "refresh_token",
          refresh_token: e.refreshToken,
          scope:         SELL_SCOPES,
        }).toString(),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        _cachedToken = {
          value:     data.access_token,
          expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
        };
        console.log("[eBay] Token refreshed — expires in", data.expires_in, "s");
        return _cachedToken.value;
      }

      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      console.error("[eBay] Token refresh failed:", err.error_description ?? res.status);
    } catch (err) {
      console.error("[eBay] Token refresh network error:", err instanceof Error ? err.message : String(err));
    }
  }

  return e.accessToken;
}

// ── XML helpers ───────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlGet(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

function xmlGetAll(xml: string, outerTag: string): string[] {
  const results: string[] = [];
  const re = new RegExp(`<${outerTag}[^>]*>([\\s\\S]*?)</${outerTag}>`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) results.push(m[1].trim());
  return results;
}

function extractEbayError(xml: string): string {
  const short = xmlGet(xml, "ShortMessage");
  const long  = xmlGet(xml, "LongMessage");
  const code  = xmlGet(xml, "ErrorCode");
  const sev   = xmlGet(xml, "SeverityCode");
  if (!short) return "Unknown eBay error — check server logs for full XML response.";
  const detail = long && long !== short ? ` — ${long}` : "";
  const suffix = code ? ` (code ${code}${sev ? `, severity: ${sev}` : ""})` : "";
  return `${short}${detail}${suffix}`;
}

function isSuccess(xml: string): boolean {
  const ack = xmlGet(xml, "Ack");
  return ack === "Success" || ack === "Warning";
}

// ── Trading API core caller ────────────────────────────────────────────────────

async function tradingCall(callName: string, xmlBody: string): Promise<string> {
  const e     = env();
  const token = await getToken();

  // eBay Trading API requires credentials inside the XML body, not just in the header.
  // Inject <RequesterCredentials> immediately after the root request element's opening tag.
  const credentials = `<RequesterCredentials><eBayAuthToken>${token}</eBayAuthToken></RequesterCredentials>`;
  const bodyWithAuth = xmlBody.replace(/(<\w+Request[^>]*>)/, `$1${credentials}`);

  const res = await fetch(TRADING_API_URL, {
    method: "POST",
    headers: {
      "X-EBAY-API-COMPATIBILITY-LEVEL": TRADING_COMPAT_LEVEL,
      "X-EBAY-API-CALL-NAME":           callName,
      "X-EBAY-API-SITEID":              EBAY_SITE_ID_DE,
      "X-EBAY-API-APP-NAME":            e.appId,
      "X-EBAY-API-DEV-NAME":            e.devId,
      "X-EBAY-API-CERT-NAME":           e.certId,
      "Content-Type":                   "text/xml;charset=utf-8",
    },
    body: bodyWithAuth,
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    console.error(`[eBay] ${callName} HTTP ${res.status}:`, text.slice(0, 500));
    throw new Error(`eBay API returned HTTP ${res.status}`);
  }

  return text;
}

// ── Field mapping helpers ─────────────────────────────────────────────────────

function buildTitle(name: string, size: string, brand: string): string {
  const raw = `${brand} ${name} ${size}`.replace(/\s+/g, " ").trim();
  return raw.length > 80 ? raw.slice(0, 77) + "..." : raw;
}

// ── Public types ──────────────────────────────────────────────────────────────

export type EbayProduct = {
  id:           number;
  sku:          string;
  brand:        string;
  name:         string;
  size:         string;
  type?:        string | null;
  price:        number;
  description?: string | null;
  image_url?:   string | null;
  inventory?:   number | null;
};

export type EbayListResult = {
  itemId?: string;
  error?:  string;
};

export type EbayListingStatus = "Active" | "Ended" | "Completed" | "Unknown";

export type EbayListingInfo = {
  itemId:    string;
  title:     string;
  status:    EbayListingStatus;
  sku?:      string;
  quantity?: number;
  price?:    number;
};

// ── List a product on eBay ────────────────────────────────────────────────────

export async function listProductOnEbay(product: EbayProduct): Promise<EbayListResult> {
  if (!isEbayConfigured()) {
    return {
      error:
        "eBay credentials not configured. " +
        "Set EBAY_APP_ID, EBAY_DEV_ID, EBAY_CERT_ID, EBAY_ACCESS_TOKEN in your environment variables.",
    };
  }

  const e       = env();
  const title   = buildTitle(product.name, product.size, product.brand);
  const desc    = product.description?.trim()
    || `${title} — ${product.type || "Tyre"}, brand new.`;
  const qty     = product.inventory && product.inventory > 0
    ? Math.min(product.inventory, 999)
    : e.defaultQty;
  const price   = Number(product.price).toFixed(2);

  const locationXml = [
    e.postalCode ? `<PostalCode>${esc(e.postalCode)}</PostalCode>` : "",
    e.location   ? `<Location>${esc(e.location)}</Location>`       : "",
  ].filter(Boolean).join("\n    ");

  const pictureXml = product.image_url
    ? `<PictureDetails><PictureURL>${esc(product.image_url)}</PictureURL></PictureDetails>`
    : "";

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <Item>
    <Title>${esc(title)}</Title>
    <Description><![CDATA[${desc}]]></Description>
    <PrimaryCategory>
      <CategoryID>${TYRE_CATEGORY_ID}</CategoryID>
    </PrimaryCategory>
    <StartPrice currencyID="EUR">${price}</StartPrice>
    <ConditionID>1000</ConditionID>
    <Country>DE</Country>
    <Currency>EUR</Currency>
    <DispatchTimeMax>3</DispatchTimeMax>
    <ListingDuration>GTC</ListingDuration>
    <ListingType>FixedPriceItem</ListingType>
    <Quantity>${qty}</Quantity>
    <SKU>${esc(product.sku)}</SKU>
    ${locationXml}
    ${pictureXml}
    <ShippingDetails>
      <ShippingType>Flat</ShippingType>
      <ShippingServiceOptions>
        <ShippingServicePriority>1</ShippingServicePriority>
        <ShippingService>DE_DHLPaket</ShippingService>
        <ShippingServiceCost currencyID="EUR">${e.shippingCost}</ShippingServiceCost>
      </ShippingServiceOptions>
    </ShippingDetails>
    <ReturnPolicy>
      <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
      <ReturnsWithinOption>Days_30</ReturnsWithinOption>
      <ShippingCostPaidByOption>Buyer</ShippingCostPaidByOption>
    </ReturnPolicy>
    <Site>Germany</Site>
  </Item>
</AddFixedPriceItemRequest>`;

  try {
    const responseXml = await tradingCall("AddFixedPriceItem", xml);
    if (!isSuccess(responseXml)) {
      const errMsg = extractEbayError(responseXml);
      console.error(`[eBay] AddFixedPriceItem failed for SKU ${product.sku}:`, errMsg);
      return { error: errMsg };
    }
    const itemId = xmlGet(responseXml, "ItemID");
    console.log(`[eBay] Listed SKU ${product.sku} → ItemID ${itemId}`);
    return { itemId: itemId ?? undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[eBay] listProductOnEbay error:`, msg);
    return { error: msg };
  }
}

// ── Remove a listing from eBay ────────────────────────────────────────────────

export async function removeProductFromEbay(itemId: string): Promise<{ error?: string }> {
  if (!isEbayConfigured()) return { error: "eBay credentials not configured." };

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<EndItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <ItemID>${esc(itemId)}</ItemID>
  <EndingReason>NotAvailable</EndingReason>
</EndItemRequest>`;

  try {
    const responseXml = await tradingCall("EndItem", xml);
    if (!isSuccess(responseXml)) {
      return { error: extractEbayError(responseXml) };
    }
    console.log(`[eBay] Ended ItemID ${itemId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Get status of a single listing ───────────────────────────────────────────

export async function getListingStatus(itemId: string): Promise<EbayListingStatus> {
  if (!isEbayConfigured() || !itemId) return "Unknown";

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <ItemID>${esc(itemId)}</ItemID>
  <OutputSelector>ListingStatus</OutputSelector>
  <OutputSelector>QuantityAvailable</OutputSelector>
</GetItemRequest>`;

  try {
    const responseXml = await tradingCall("GetItem", xml);
    if (!isSuccess(responseXml)) return "Unknown";

    const status = xmlGet(responseXml, "ListingStatus");
    if (status === "Active") {
      const qty = parseInt(xmlGet(responseXml, "QuantityAvailable") ?? "1", 10);
      return qty === 0 ? "Ended" : "Active";
    }
    if (status === "Ended")     return "Ended";
    if (status === "Completed") return "Completed";
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

// ── Get all active seller listings ────────────────────────────────────────────

export async function getActiveListings(): Promise<{
  count:    number;
  listings: EbayListingInfo[];
}> {
  if (!isEbayConfigured()) return { count: 0, listings: [] };

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <ActiveList>
    <Include>true</Include>
    <Pagination>
      <EntriesPerPage>200</EntriesPerPage>
      <PageNumber>1</PageNumber>
    </Pagination>
    <Sort>ItemID</Sort>
  </ActiveList>
  <OutputSelector>ItemID</OutputSelector>
  <OutputSelector>Title</OutputSelector>
  <OutputSelector>SKU</OutputSelector>
  <OutputSelector>QuantityAvailable</OutputSelector>
  <OutputSelector>CurrentPrice</OutputSelector>
  <OutputSelector>ActiveList.PaginationResult</OutputSelector>
</GetMyeBaySellingRequest>`;

  try {
    const responseXml = await tradingCall("GetMyeBaySelling", xml);
    if (!isSuccess(responseXml)) {
      console.error("[eBay] GetMyeBaySelling failed:", extractEbayError(responseXml));
      return { count: 0, listings: [] };
    }

    const totalStr = xmlGet(responseXml, "TotalNumberOfEntries");
    const count    = totalStr ? parseInt(totalStr, 10) : 0;

    const itemBlocks = xmlGetAll(responseXml, "Item");
    const listings: EbayListingInfo[] = itemBlocks
      .map((block) => ({
        itemId:   xmlGet(block, "ItemID")          ?? "",
        title:    xmlGet(block, "Title")           ?? "",
        sku:      xmlGet(block, "SKU")             ?? undefined,
        quantity: parseInt(xmlGet(block, "QuantityAvailable") ?? "0", 10),
        price:    parseFloat(xmlGet(block, "CurrentPrice")    ?? "0"),
        status:   "Active" as EbayListingStatus,
      }))
      .filter((l) => !!l.itemId);

    return { count: count || listings.length, listings };
  } catch (err) {
    console.error("[eBay] getActiveListings error:", err instanceof Error ? err.message : String(err));
    return { count: 0, listings: [] };
  }
}
