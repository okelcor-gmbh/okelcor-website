export const EU_COUNTRIES = new Set([
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary",
  "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta",
  "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia",
  "Spain", "Sweden",
]);

export function isEuCountryExceptGermany(country: string): boolean {
  return EU_COUNTRIES.has(country) && country !== "Germany";
}

/**
 * Show the VAT field only for B2B customers in an EU country.
 * B2C: never. B2B non-EU: never (export — VAT exempt). B2B no country yet: never.
 */
export function shouldShowVatField(country: string, customerType: string): boolean {
  if (customerType !== "b2b") return false;
  if (!country) return false;
  return EU_COUNTRIES.has(country);
}

/**
 * VAT validation is mandatory only for B2B customers in EU countries outside Germany.
 * Germany B2B: optional (German VAT still applies, no reverse charge).
 */
export function isVatRequired(country: string, customerType: string): boolean {
  if (customerType !== "b2b") return false;
  return isEuCountryExceptGermany(country);
}

/**
 * True for B2B customers shipping to a non-EU destination.
 * Used to show the "Export order — VAT exempt." informational note.
 */
export function isNonEuB2B(country: string, customerType: string): boolean {
  if (customerType !== "b2b") return false;
  if (!country) return false;
  return !EU_COUNTRIES.has(country);
}
