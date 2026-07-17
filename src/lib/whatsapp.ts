const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? '5217226830208';

export function buildWhatsAppLink(folio: string, title?: string) {
  const message = title
    ? `Hola, me interesa la propiedad ${folio} (${title})`
    : `Hola, me interesa la propiedad ${folio}`;
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${WHATSAPP_NUMBER}?${params.toString()}`;
}
