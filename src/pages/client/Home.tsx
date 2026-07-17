import { useMemo, useState } from 'react';
import { ClientHeader } from '@/components/ClientHeader';
import { PropertyCard } from '@/components/PropertyCard';
import { useLocale } from '@/i18n';
import { useProperties } from '@/hooks/useProperties';
import { propertyPhotoUrl } from '@/lib/storage';
import type { Modality } from '@/types/database';

const MUNICIPALITIES = ['Toluca', 'Metepec', 'San Mateo Atenco', 'Calimaya'];

export function Home() {
  const { t } = useLocale();
  const [modality, setModality] = useState<Modality>('venta');
  const [municipality, setMunicipality] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const filters = useMemo(() => ({ modality, municipality, search }), [modality, municipality, search]);
  const { properties, loading } = useProperties(filters);

  return (
    <div className="min-h-screen bg-fusiona-bg">
      <ClientHeader />

      <section className="flex flex-col gap-6 px-5 pb-9 pt-10 sm:px-10 sm:pb-12 sm:pt-14">
        <div>
          <h1 className="whitespace-pre-line font-sans text-[32px] font-extrabold uppercase leading-[1.08] tracking-wide text-fusiona-black sm:text-[44px] sm:leading-[1.05]">
            {t.home.heroTitle}
          </h1>
          <p className="mt-2 text-[14px] font-medium text-neutral-600 sm:text-[15px]">
            {t.home.heroSubtitle}
          </p>
        </div>

        <div className="flex max-w-3xl flex-col gap-2.5 rounded-2xl border border-black/10 bg-white p-2.5 shadow-sm sm:flex-row sm:items-center sm:gap-2.5">
          <div className="flex overflow-hidden rounded-xl bg-[#F2F0EC] text-[13px] font-bold">
            <button
              type="button"
              onClick={() => setModality('venta')}
              className={`flex-1 rounded-xl px-5 py-3 transition-colors sm:flex-none ${
                modality === 'venta' ? 'bg-fusiona-black text-white' : 'text-neutral-600'
              }`}
            >
              {t.home.sale}
            </button>
            <button
              type="button"
              onClick={() => setModality('renta')}
              className={`flex-1 rounded-xl px-5 py-3 transition-colors sm:flex-none ${
                modality === 'renta' ? 'bg-fusiona-black text-white' : 'text-neutral-600'
              }`}
            >
              {t.home.rent}
            </button>
          </div>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearch(searchInput);
            }}
            placeholder={t.home.searchPlaceholder}
            className="flex-1 rounded-xl border-none bg-transparent px-3.5 py-3 text-[14px] font-medium text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={() => setSearch(searchInput)}
            className="rounded-xl bg-fusiona-red px-6 py-3 text-[13px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-fusiona-red-dark"
          >
            {t.home.search}
          </button>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto text-[12.5px] font-semibold">
          <button
            type="button"
            onClick={() => setMunicipality(undefined)}
            className={`flex-none rounded-full px-4 py-2 transition-colors ${
              !municipality ? 'bg-fusiona-black text-white' : 'border border-black/10 bg-white text-neutral-700'
            }`}
          >
            {t.home.all}
          </button>
          {MUNICIPALITIES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMunicipality(m)}
              className={`flex-none rounded-full px-4 py-2 transition-colors ${
                municipality === m ? 'bg-fusiona-black text-white' : 'border border-black/10 bg-white text-neutral-700'
              }`}
            >
              {(t.municipalities as Record<string, string>)[m]}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-10">
        {loading ? (
          <p className="py-16 text-center text-sm font-medium text-neutral-500">{t.home.loading}</p>
        ) : properties.length === 0 ? (
          <p className="py-16 text-center text-sm font-medium text-neutral-500">{t.home.noResults}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                coverPhotoUrl={p.cover_photo_path ? propertyPhotoUrl(p.cover_photo_path) : null}
                detail={[
                  p.bedrooms ? `${p.bedrooms} rec` : null,
                  p.construction_m2 ? `${p.construction_m2} m²` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="flex flex-col items-center justify-between gap-2 border-t border-black/[.06] bg-white px-5 py-5 text-[11.5px] font-medium text-neutral-400 sm:flex-row sm:px-10">
        <span>Fusiona Real Estate — Toluca · Metepec · San Mateo Atenco · Calimaya</span>
        <span className="font-bold text-fusiona-red">WhatsApp 722 683 0208</span>
      </footer>
    </div>
  );
}
