import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClientHeader } from '@/components/ClientHeader';
import { Lightbox } from '@/components/Lightbox';
import { PropertyMap } from '@/components/PropertyMap';
import { PropertyQR } from '@/components/PropertyQR';
import { ScheduleVisitSheet } from '@/components/ScheduleVisitSheet';
import { useLocale } from '@/i18n';
import { usePropertyDetail } from '@/hooks/usePropertyDetail';
import { propertyPhotoUrl } from '@/lib/storage';
import { buildWhatsAppLink, buildWhatsAppShareLink } from '@/lib/whatsapp';
import { formatPrice, municipalityLabel } from '@/lib/format';

export function PropertyDetail() {
  const { folio } = useParams<{ folio: string }>();
  const { t } = useLocale();
  const { property, areas, loading, error } = usePropertyDetail(folio);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showVisitSheet, setShowVisitSheet] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeArea = useMemo(() => {
    if (!areas.length) return null;
    return areas.find((a) => a.id === activeAreaId) ?? areas[0];
  }, [areas, activeAreaId]);

  const activePhoto = activeArea?.photos[activePhotoIndex] ?? activeArea?.photos[0];

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/propiedades/${folio ?? ''}`;
  }, [folio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-fusiona-bg">
        <ClientHeader backLink={{ to: '/', label: t.detail.back }} />
        <p className="py-24 text-center text-sm font-medium text-neutral-500">{t.detail.loading}</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-fusiona-bg">
        <ClientHeader backLink={{ to: '/', label: t.detail.back }} />
        <div className="flex flex-col items-center gap-4 py-24">
          <p className="text-sm font-medium text-neutral-500">{t.detail.notFound}</p>
          <Link to="/" className="text-sm font-bold text-fusiona-red">
            {t.detail.back}
          </Link>
        </div>
      </div>
    );
  }

  const facts = [
    { value: property.bedrooms, label: t.detail.bedrooms },
    { value: property.bathrooms, label: t.detail.bathrooms },
    { value: property.construction_m2 ? `${property.construction_m2} m²` : null, label: t.detail.construction },
    { value: property.parking_spots, label: t.detail.parking },
  ].filter((f) => f.value !== null && f.value !== undefined);

  const lightboxPhotos =
    activeArea?.photos.map((photo) => ({
      url: propertyPhotoUrl(photo.storage_path),
      alt: activeArea.area_name,
    })) ?? [];

  const shareHref = buildWhatsAppShareLink(publicUrl, property.folio, property.title, t.detail.shareMessage);

  return (
    <div className="min-h-screen bg-fusiona-bg">
      <ClientHeader backLink={{ to: '/', label: t.detail.back }} />

      <div className="mx-auto max-w-6xl px-5 pb-28 pt-6 sm:px-10 sm:pb-16">
        <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <span className="rounded-md bg-fusiona-black px-2.5 py-1.5 font-mono text-xs font-extrabold tracking-wide text-white">
                {property.folio}
              </span>
              <span className="rounded-md border border-black/10 px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-neutral-600">
                {property.modality === 'venta' ? t.home.sale : t.home.rent}
              </span>
            </div>
            <h1 className="font-sans text-2xl font-extrabold uppercase leading-tight text-fusiona-black sm:text-[30px]">
              {property.title}
            </h1>
            <span className="text-sm font-medium text-neutral-500">
              {municipalityLabel(property.municipality, t)}
              {property.neighborhood ? `, ${property.neighborhood}` : ''}
            </span>
          </div>
          <div className="hidden font-sans text-[32px] font-extrabold text-fusiona-black sm:block">
            {formatPrice(property.price, property.modality, t)}
          </div>
          <div className="font-sans text-2xl font-extrabold text-fusiona-black sm:hidden">
            {formatPrice(property.price, property.modality, t)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_320px]">
          {areas.length > 0 && (
            <nav className="scrollbar-none flex gap-2 overflow-x-auto text-sm font-semibold lg:flex-col lg:overflow-visible">
              {areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => {
                    setActiveAreaId(area.id);
                    setActivePhotoIndex(0);
                  }}
                  className={`flex flex-none items-center justify-between gap-3 rounded-xl px-3.5 py-3 transition-colors ${
                    activeArea?.id === area.id ? 'bg-fusiona-black text-white' : 'text-neutral-600'
                  }`}
                >
                  <span>{area.area_name}</span>
                  <span className="font-mono text-[11px] opacity-60">{area.photos.length}</span>
                </button>
              ))}
            </nav>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => activePhoto && setLightboxOpen(true)}
              disabled={!activePhoto}
              className="photo-placeholder relative flex h-[280px] items-center justify-center overflow-hidden rounded-2xl sm:h-[400px]"
            >
              {activePhoto ? (
                <img
                  src={propertyPhotoUrl(activePhoto.storage_path)}
                  alt={activeArea?.area_name}
                  className="h-full w-full rounded-2xl object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
              ) : (
                <span className="font-mono text-xs text-[#8a857e]">{t.card.photo}</span>
              )}
              {activeArea && activeArea.photos.length > 0 && (
                <span className="absolute bottom-3.5 right-3.5 rounded-lg bg-black/[.85] px-3 py-1.5 text-[11px] font-bold text-white">
                  {activeArea.area_name} · {activePhotoIndex + 1} {t.detail.of} {activeArea.photos.length}
                </span>
              )}
            </button>
            {activeArea && activeArea.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {activeArea.photos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`h-16 overflow-hidden rounded-lg border-2 ${
                      idx === activePhotoIndex ? 'border-fusiona-red' : 'border-transparent'
                    }`}
                  >
                    <img src={propertyPhotoUrl(photo.storage_path)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                {t.detail.location}
              </span>
              {property.latitude != null && property.longitude != null ? (
                <PropertyMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  height={280}
                  popupContent={`<strong>${property.folio}</strong><br>${property.title}`}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-center text-xs font-medium text-neutral-400">
                  {t.detail.locationMissing}
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="flex flex-col gap-3.5 rounded-2xl border border-black/[.07] bg-white p-5">
              {facts.length > 0 && (
                <div className="grid grid-cols-2 gap-3 text-xs font-medium text-neutral-500">
                  {facts.map((f) => (
                    <div key={f.label}>
                      <div className="font-sans text-lg font-extrabold text-fusiona-black">{f.value}</div>
                      {f.label}
                    </div>
                  ))}
                </div>
              )}
              {property.description && (
                <p className="border-t border-black/[.06] pt-3.5 text-[12.5px] font-normal leading-relaxed text-neutral-600">
                  {property.description}
                </p>
              )}
            </div>

            <div className="hidden flex-col gap-2.5 sm:flex">
              <a
                href={buildWhatsAppLink(property.folio, property.title)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-fusiona-red py-4 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-fusiona-red-dark"
              >
                {t.detail.whatsappAsk} {property.folio}
              </a>
              <button
                type="button"
                onClick={() => setShowVisitSheet(true)}
                className="flex items-center justify-center rounded-xl border-[1.5px] border-fusiona-black py-3.5 text-[13px] font-extrabold uppercase tracking-wide text-fusiona-black transition-colors hover:bg-fusiona-black hover:text-white"
              >
                {t.detail.scheduleVisit}
              </button>
              <a
                href={shareHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded-xl border border-black/10 bg-white py-3 text-[12.5px] font-bold uppercase tracking-wide text-fusiona-black transition-colors hover:border-fusiona-black"
              >
                {t.detail.share}
              </a>
            </div>

            <PropertyQR url={publicUrl} folio={property.folio} />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 flex gap-2 border-t border-black/[.07] bg-fusiona-bg/95 px-4 py-3 sm:hidden">
        <a
          href={buildWhatsAppLink(property.folio, property.title)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-[1.4] items-center justify-center rounded-xl bg-fusiona-red py-4 text-xs font-extrabold uppercase tracking-wide text-white"
        >
          {t.detail.whatsapp}
        </a>
        <button
          type="button"
          onClick={() => setShowVisitSheet(true)}
          className="flex flex-1 items-center justify-center rounded-xl border-[1.5px] border-fusiona-black py-4 text-xs font-extrabold uppercase tracking-wide text-fusiona-black"
        >
          {t.detail.scheduleVisit}
        </button>
        <a
          href={shareHref}
          target="_blank"
          rel="noreferrer"
          aria-label={t.detail.share}
          className="flex flex-none items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-4 text-xs font-bold uppercase text-fusiona-black"
        >
          ⤴
        </a>
      </div>

      {showVisitSheet && <ScheduleVisitSheet property={property} onClose={() => setShowVisitSheet(false)} />}

      {lightboxOpen && activeArea && (
        <Lightbox
          photos={lightboxPhotos}
          index={activePhotoIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() =>
            setActivePhotoIndex((idx) => (idx - 1 + lightboxPhotos.length) % lightboxPhotos.length)
          }
          onNext={() => setActivePhotoIndex((idx) => (idx + 1) % lightboxPhotos.length)}
          caption={activeArea.area_name}
        />
      )}
    </div>
  );
}
