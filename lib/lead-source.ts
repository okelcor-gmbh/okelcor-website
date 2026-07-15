/** Synthetic placeholder e-mail assigned to WhatsApp-originated leads until staff replace it with a real one during triage. */
const SYNTHETIC_WHATSAPP_EMAIL_RE = /^whatsapp\+.*@no-email\.okelcor\.internal$/i;

export function isSyntheticWhatsappEmail(email?: string | null): boolean {
  return !!email && SYNTHETIC_WHATSAPP_EMAIL_RE.test(email);
}
