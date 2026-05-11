export function formatIncoterm(value: string | null | undefined): string {
  if (!value) return "Incoterms 2020: FOB Germany unless otherwise agreed in writing.";
  if (value === "CIF") return "Incoterms 2020: CIF destination port — freight and insurance included to destination port.";
  if (value === "Custom") return "Custom shipping arrangement — to be confirmed in quotation.";
  return `Incoterms 2020: ${value}`;
}

export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/images/tyre-placeholder.svg'
  if (imagePath.startsWith('http')) return imagePath
  const cleanPath = imagePath.replace(/^storage\//, '')
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')
    || 'https://api.takeovercreatives.com'
  return `${apiBase}/storage/${cleanPath}`
}
