import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/i18n';
import { useMunicipalityCodes } from '@/hooks/useMunicipalityCodes';
import { supabase, PROPERTY_PHOTOS_BUCKET } from '@/lib/supabaseClient';
import { propertyPhotoUrl } from '@/lib/storage';
import type { Modality, PropertyPhotoRow, PropertyStatus } from '@/types/database';

interface AreaDraft {
  id: string;
  isNew: boolean;
  area_name: string;
  order: number;
  photos: PhotoDraft[];
}

interface PhotoDraft {
  id: string;
  isNew: boolean;
  storage_path?: string;
  file?: File;
  previewUrl: string;
}

const emptyForm = {
  municipality: '',
  modality: 'venta' as Modality,
  title: '',
  price: '',
  description: '',
  bedrooms: '',
  bathrooms: '',
  construction_m2: '',
  parking_spots: '',
  neighborhood: '',
};

export function PropertyForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'nueva';
  const navigate = useNavigate();
  const { t } = useLocale();
  const { codes } = useMunicipalityCodes();

  const [form, setForm] = useState(emptyForm);
  const [folio, setFolio] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [areas, setAreas] = useState<AreaDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !id) return;
    const currentId = id;

    async function load() {
      const { data: property } = await supabase.from('properties').select('*').eq('id', currentId).maybeSingle();
      if (!property) return;

      setPropertyId(property.id);
      setFolio(property.folio);
      setForm({
        municipality: property.municipality,
        modality: property.modality,
        title: property.title,
        price: String(property.price),
        description: property.description ?? '',
        bedrooms: property.bedrooms?.toString() ?? '',
        bathrooms: property.bathrooms?.toString() ?? '',
        construction_m2: property.construction_m2?.toString() ?? '',
        parking_spots: property.parking_spots?.toString() ?? '',
        neighborhood: property.neighborhood ?? '',
      });

      const { data: areaRows } = await supabase
        .from('property_areas')
        .select('*, property_photos(*)')
        .eq('property_id', property.id)
        .order('order', { ascending: true });

      setAreas(
        (areaRows ?? []).map((a) => ({
          id: a.id,
          isNew: false,
          area_name: a.area_name,
          order: a.order,
          photos: (((a as { property_photos?: PropertyPhotoRow[] }).property_photos ?? []) as PropertyPhotoRow[])
            .slice()
            .sort((x, y) => x.order - y.order)
            .map((p) => ({
              id: p.id,
              isNew: false,
              storage_path: p.storage_path,
              previewUrl: propertyPhotoUrl(p.storage_path),
            })),
        })),
      );
    }

    load();
  }, [id, isNew]);

  function addArea() {
    setAreas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), isNew: true, area_name: '', order: prev.length, photos: [] },
    ]);
  }

  function updateAreaName(areaId: string, name: string) {
    setAreas((prev) => prev.map((a) => (a.id === areaId ? { ...a, area_name: name } : a)));
  }

  function removeArea(areaId: string) {
    setAreas((prev) => prev.filter((a) => a.id !== areaId));
  }

  function addPhoto(areaId: string, file: File) {
    const previewUrl = URL.createObjectURL(file);
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? { ...a, photos: [...a.photos, { id: crypto.randomUUID(), isNew: true, file, previewUrl }] }
          : a,
      ),
    );
  }

  async function handleSave(publish: boolean) {
    setSaving(true);
    setMessage(null);

    try {
      const status: PropertyStatus = publish ? 'activa' : 'pausada';
      const payload = {
        municipality: form.municipality,
        modality: form.modality,
        title: form.title,
        price: Number(form.price) || 0,
        description: form.description || null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        construction_m2: form.construction_m2 ? Number(form.construction_m2) : null,
        parking_spots: form.parking_spots ? Number(form.parking_spots) : null,
        neighborhood: form.neighborhood || null,
        status,
      };

      let currentPropertyId = propertyId;
      let currentFolio = folio;

      if (isNew && !currentPropertyId) {
        const { data, error } = await supabase.from('properties').insert(payload).select().single();
        if (error) throw error;
        currentPropertyId = data.id;
        currentFolio = data.folio;
        setPropertyId(data.id);
        setFolio(data.folio);
      } else if (currentPropertyId) {
        const { error } = await supabase.from('properties').update(payload).eq('id', currentPropertyId);
        if (error) throw error;
      }

      if (!currentPropertyId) throw new Error('missing property id');

      for (const area of areas) {
        let areaId = area.id;
        if (area.isNew) {
          const { data, error } = await supabase
            .from('property_areas')
            .insert({ property_id: currentPropertyId, area_name: area.area_name, order: area.order })
            .select()
            .single();
          if (error) throw error;
          areaId = data.id;
        } else {
          await supabase
            .from('property_areas')
            .update({ area_name: area.area_name, order: area.order })
            .eq('id', area.id);
        }

        for (const photo of area.photos) {
          if (!photo.isNew || !photo.file) continue;
          const ext = photo.file.name.split('.').pop() ?? 'jpg';
          const path = `${currentPropertyId}/${areaId}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from(PROPERTY_PHOTOS_BUCKET)
            .upload(path, photo.file);
          if (uploadError) throw uploadError;

          const order = area.photos.filter((p) => !p.isNew).length + area.photos.indexOf(photo);
          const { error: insertError } = await supabase
            .from('property_photos')
            .insert({ area_id: areaId, storage_path: path, order });
          if (insertError) throw insertError;
        }
      }

      setMessage(t.admin.form.saved);
      if (isNew && currentPropertyId) {
        navigate(`/admin/propiedades/${currentPropertyId}`, { replace: true });
      }
      void currentFolio;
    } catch {
      setMessage(t.admin.form.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <Link to="/admin" className="text-xs font-semibold text-neutral-500">
            {t.admin.form.backToInventory}
          </Link>
          <h1 className="font-sans text-lg font-extrabold uppercase text-fusiona-black">
            {isNew ? t.admin.form.newProperty : t.admin.form.editProperty}
          </h1>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="rounded-[10px] border-[1.5px] border-black/15 px-4.5 py-3 text-xs font-extrabold uppercase text-neutral-600 disabled:opacity-60"
          >
            {t.admin.form.saveDraft}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="rounded-[10px] bg-fusiona-red px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white disabled:opacity-60"
          >
            {saving ? t.admin.form.saving : t.admin.form.publish}
          </button>
        </div>
      </div>

      {message && <p className="text-xs font-semibold text-fusiona-black">{message}</p>}

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-3.5">
          {folio && (
            <div className="flex items-center justify-between rounded-[14px] bg-fusiona-black px-4.5 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">
                  {t.admin.form.generatedFolio}
                </span>
                <span className="font-mono text-xl font-extrabold tracking-wide text-white">{folio}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 rounded-[14px] border border-black/[.07] bg-white p-4.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
              {t.admin.form.generalData}
            </span>
            <select
              value={form.municipality}
              onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))}
              className="rounded-[9px] border border-black/10 px-3.5 py-3 text-sm font-medium text-neutral-700"
            >
              <option value="">{t.admin.form.municipality}</option>
              {codes.map((c) => (
                <option key={c.id} value={c.municipality}>
                  {c.municipality}
                </option>
              ))}
            </select>
            <div className="flex overflow-hidden rounded-[9px] bg-[#F2F0EC] text-xs font-bold">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, modality: 'venta' }))}
                className={`flex-1 py-2.75 ${form.modality === 'venta' ? 'rounded-[9px] bg-fusiona-black text-white' : 'text-neutral-600'}`}
              >
                {t.home.sale}
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, modality: 'renta' }))}
                className={`flex-1 py-2.75 ${form.modality === 'renta' ? 'rounded-[9px] bg-fusiona-black text-white' : 'text-neutral-600'}`}
              >
                {t.home.rent}
              </button>
            </div>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t.admin.form.title}
              className="rounded-[9px] border border-black/10 px-3.5 py-3 text-sm font-medium text-neutral-700"
            />
            <input
              value={form.neighborhood}
              onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
              placeholder={t.admin.form.municipality + ' — colonia'}
              className="rounded-[9px] border border-black/10 px-3.5 py-3 text-sm font-medium text-neutral-700"
            />
            <input
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder={t.admin.form.price}
              type="number"
              className="rounded-[9px] border border-black/10 px-3.5 py-3 text-sm font-medium text-neutral-700"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                value={form.bedrooms}
                onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
                placeholder={t.detail.bedrooms}
                type="number"
                className="rounded-[9px] border border-black/10 px-3.5 py-3 text-sm font-medium text-neutral-700"
              />
              <input
                value={form.bathrooms}
                onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
                placeholder={t.detail.bathrooms}
                type="number"
                step="0.5"
                className="rounded-[9px] border border-black/10 px-3.5 py-3 text-sm font-medium text-neutral-700"
              />
              <input
                value={form.construction_m2}
                onChange={(e) => setForm((f) => ({ ...f, construction_m2: e.target.value }))}
                placeholder={t.detail.construction}
                type="number"
                className="rounded-[9px] border border-black/10 px-3.5 py-3 text-sm font-medium text-neutral-700"
              />
              <input
                value={form.parking_spots}
                onChange={(e) => setForm((f) => ({ ...f, parking_spots: e.target.value }))}
                placeholder={t.detail.parking}
                type="number"
                className="rounded-[9px] border border-black/10 px-3.5 py-3 text-sm font-medium text-neutral-700"
              />
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t.admin.form.description}
              rows={3}
              className="rounded-[9px] border border-black/10 px-3.5 py-3 text-sm font-medium text-neutral-700"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
              {t.admin.form.photosByArea}
            </span>
            <button type="button" onClick={addArea} className="text-xs font-extrabold text-fusiona-red">
              {t.admin.form.addArea}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {areas.map((area) => (
              <div key={area.id} className="flex flex-col gap-2.5 rounded-[14px] border border-black/[.07] bg-white p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <input
                    value={area.area_name}
                    onChange={(e) => updateAreaName(area.id, e.target.value)}
                    placeholder={t.admin.form.areaName}
                    className="flex-1 rounded-md border border-transparent bg-transparent text-sm font-bold text-fusiona-black outline-none focus:border-black/10"
                  />
                  <button
                    type="button"
                    onClick={() => removeArea(area.id)}
                    className="font-mono text-[11px] font-semibold text-neutral-400 hover:text-fusiona-red"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {area.photos.map((photo) => (
                    <div key={photo.id} className="h-11 w-[58px] overflow-hidden rounded-[7px]">
                      <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  <label className="flex h-11 w-[58px] cursor-pointer items-center justify-center rounded-[7px] border-[1.5px] border-dashed border-black/20 text-base font-semibold text-neutral-300">
                    +
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        Array.from(e.target.files ?? []).forEach((file) => addPhoto(area.id, file));
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
