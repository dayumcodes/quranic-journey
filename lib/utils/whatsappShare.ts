/** Keep under common URL / proxy limits; full text should use Copy instead. */
const WHATSAPP_TEXT_SAFE_MAX = 1600;

export function buildWhatsAppShareUrl(fullText: string): string {
  const text = fullText.length > WHATSAPP_TEXT_SAFE_MAX ? `${fullText.slice(0, WHATSAPP_TEXT_SAFE_MAX - 1)}…` : fullText;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
