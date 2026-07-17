import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PropertyStatusBadge } from '@/components/StatusBadge';
import { useLocale } from '@/i18n';
import { useAdminProperties } from '@/hooks/useAdminProperties';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice, modalityLabel, municipalityLabel } from '@/lib/format';

export function Dashboard() {
  const { t } = useLocale();
  const { properties, loading, reload } = useAdminProperties();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [modality, setModality] = useState('');
  const [status, setStatus] = useState('');

  const cities = useMemo(() => Array.from(new Set(properties.map((p) => p.municipality))), [properties]);

  const filtered = properties.filter((p) => {
    if (city && p.municipality !== city) return false;
    if (modality && p.modality !== modality) return false;
    if (status && p.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.folio.toLowerCase().includes(q) && !(p.neighborhood ?? '').toLowerCase().includes(q) && !p.title.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  async function handleDeactivate(id: string) {
    await supabase.from('properties').update({ status: 'pausada' }).eq('id', id);
    reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-extrabold uppercase text-fusiona-black">
            {t.admin.inventory.title}
          </h1>
          <span className="text-xs font-medium text-neutral-500">
            {properties.length} {t.admin.inventory.countLabel} ·{' '}
            {properties.filter((p) => p.status === 'activa').length} {t.admin.inventory.available}
          </span>
        </div>
        <Link
          to="/admin/propiedades/nueva"
          className="rounded-[10px] bg-fusiona-red px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-fusiona-red-dark"
        >
          {t.admin.inventory.newProperty}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.admin.inventory.searchPlaceholder}
          className="max-w-xs flex-1 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-xs font-medium outline-none"
        />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-600"
        >
          <option value="">{t.admin.inventory.cityAll}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {municipalityLabel(c, t)}
            </option>
          ))}
        </select>
        <select
          value={modality}
          onChange={(e) => setModality(e.target.value)}
          className="rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-600"
        >
          <option value="">{t.admin.inventory.modalityAll}</option>
          <option value="venta">{t.home.sale}</option>
          <option value="renta">{t.home.rent}</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-600"
        >
          <option value="">{t.admin.inventory.statusAll}</option>
          <option value="activa">{t.status.activa}</option>
          <option value="pausada">{t.status.pausada}</option>
          <option value="vendida">{t.status.vendida}</option>
          <option value="rentada">{t.status.rentada}</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-black/[.07] bg-white">
        <div className="grid grid-cols-[80px_1.6fr_1fr_.8fr_1fr_.9fr_130px] gap-3 border-b border-black/[.06] px-5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-neutral-400">
          <span>{t.admin.inventory.folio}</span>
          <span>{t.admin.inventory.property}</span>
          <span>{t.admin.inventory.city}</span>
          <span>{t.admin.inventory.modality}</span>
          <span>{t.admin.inventory.price}</span>
          <span>{t.admin.inventory.status}</span>
          <span />
        </div>

        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">{t.common.loading}</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">{t.admin.inventory.empty}</p>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[80px_1.6fr_1fr_.8fr_1fr_.9fr_130px] items-center gap-3 border-b border-black/[.05] px-5 py-3.5 text-[12.5px] font-medium text-neutral-600"
            >
              <span className="w-fit rounded-md bg-[#F2F0EC] px-2.5 py-1 font-mono text-[11px] font-extrabold text-fusiona-black">
                {p.folio}
              </span>
              <span className="truncate font-semibold text-fusiona-black">{p.title}</span>
              <span>{municipalityLabel(p.municipality, t)}</span>
              <span>{modalityLabel(p.modality, t)}</span>
              <span className="font-bold text-fusiona-black">{formatPrice(p.price, p.modality, t)}</span>
              <span className="w-fit">
                <PropertyStatusBadge status={p.status} />
              </span>
              <span className="flex gap-3 text-[11.5px] font-semibold text-neutral-500">
                <Link to={`/admin/propiedades/${p.id}`}>{t.admin.inventory.edit}</Link>
                <button type="button" onClick={() => handleDeactivate(p.id)} className="text-fusiona-red">
                  {t.admin.inventory.remove}
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
