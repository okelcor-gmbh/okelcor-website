export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/images/tyre-placeholder.svg'
  if (imagePath.startsWith('http')) return imagePath
  const cleanPath = imagePath.replace(/^storage\//, '')
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')
    || 'https://api.takeovercreatives.com'
  return `${apiBase}/storage/${cleanPath}`
}
