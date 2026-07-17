import { Link } from 'react-router-dom';
import type { PropertyRow } from '@/types/database';
import { useLocale } from '@/i18n';
import { formatPrice, modalityLabel, municipalityLabel } from '@/lib/format';

interface PropertyCardProps {
  property: PropertyRow;
  coverPhotoUrl?: string | null;
  detail?: string;
}

export function PropertyCard({ property, coverPhotoUrl, detail }: PropertyCardProps) {
  const { t } = useLocale();

  return (
    <Link
      to={`/propiedades/${property.folio}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-black/[.07] bg-white transition-shadow hover:shadow-md"
    >
      <div className="photo-placeholder relative flex h-[200px] items-center justify-center">
        {coverPhotoUrl ? (
          <img src={coverPhotoUrl} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono text-[11px] text-[#8a857e]">
            {t.card.photo} · {property.folio}
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-fusiona-black px-2.5 py-1 font-mono text-[11px] font-extrabold tracking-wide text-white">
          {property.folio}
        </span>
        <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-fusiona-black">
          {modalityLabel(property.modality, t)}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 px-[18px] py-4">
        <div className="text-[17px] font-extrabold text-fusiona-black">
          {formatPrice(property.price, property.modality, t)}
        </div>
        <div className="text-[13px] font-semibold text-neutral-700">{property.title}</div>
        <div className="text-[12px] font-medium text-neutral-500">
          {municipalityLabel(property.municipality, t)}
          {detail ? ` · ${detail}` : ''}
        </div>
      </div>
    </Link>
  );
}
