import type { Modality } from '@/types/database';
import type { Dictionary } from '@/i18n/es';

export function formatPrice(price: number, modality: Modality, t: Dictionary) {
  const amount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(price);
  return modality === 'renta' ? `${amount} MXN${t.home.perMonth}` : `${amount} MXN`;
}

export function municipalityLabel(municipality: string, t: Dictionary) {
  return (t.municipalities as Record<string, string>)[municipality] ?? municipality;
}

export function modalityLabel(modality: Modality, t: Dictionary) {
  return modality === 'venta' ? t.home.sale : t.home.rent;
}
