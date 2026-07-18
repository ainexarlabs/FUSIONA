const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? '5217226830208';

// Format the human-friendly WhatsApp number for display (e.g. "722 683 0208").
export function formatWhatsAppNumber() {
  const digits = WHATSAPP_NUMBER.replace(/^521/, '');
  if (digits.length !== 10) return WHATSAPP_NUMBER;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function build(text: string) {
  const params = new URLSearchParams({ text });
  return `https://wa.me/${WHATSAPP_NUMBER}?${params.toString()}`;
}

// Link used from a property card / detail — the customer texts the agency asking
// about a specific property using its folio.
export function buildWhatsAppLink(folio: string, title?: string) {
  const message = title
    ? `Hola, me interesa la propiedad ${folio} (${title})`
    : `Hola, me interesa la propiedad ${folio}`;
  return build(message);
}

// Link used for a generic contact CTA (About page, footer, etc.) — no folio.
export function buildWhatsAppContactLink() {
  return build('Hola, me gustaría más información sobre las propiedades de Fusiona Real Estate.');
}

// Link a visitor uses to SHARE a property with a third party. Opens WhatsApp
// with the property URL and a short intro so any contact receives the link.
export function buildWhatsAppShareLink(propertyUrl: string, folio: string, title: string, intro: string) {
  const message = `${intro} — ${title} (${folio}): ${propertyUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
