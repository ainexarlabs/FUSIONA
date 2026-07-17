import { useState } from 'react';
import { useLocale } from '@/i18n';
import { useMunicipalityCodes } from '@/hooks/useMunicipalityCodes';
import { supabase } from '@/lib/supabaseClient';
import type { MunicipalityCodeRow } from '@/types/database';

export function MunicipalityCodes() {
  const { t } = useLocale();
  const { codes, loading, reload } = useMunicipalityCodes();
  const [drafts, setDrafts] = useState<Record<string, Partial<MunicipalityCodeRow>>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateDraft(id: string, field: keyof MunicipalityCodeRow, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function value(row: MunicipalityCodeRow, field: keyof MunicipalityCodeRow) {
    return (drafts[row.id]?.[field] as string | undefined) ?? (row[field] as string);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await Promise.all(
        Object.entries(drafts).map(([id, patch]) => supabase.from('municipality_codes').update(patch).eq('id', id)),
      );
      setDrafts({});
      await reload();
      setMessage(t.admin.municipalityCodes.saved);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-neutral-500">{t.common.loading}</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="font-sans text-2xl font-extrabold uppercase text-fusiona-black">
          {t.admin.municipalityCodes.title}
        </h1>
        <p className="text-xs font-medium text-neutral-500">{t.admin.municipalityCodes.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-black/[.07] bg-white">
        <div className="grid grid-cols-4 gap-3 border-b border-black/[.06] px-5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-neutral-400">
          <span>{t.admin.municipalityCodes.municipality}</span>
          <span>{t.admin.municipalityCodes.code}</span>
          <span>{t.admin.municipalityCodes.saleSuffix}</span>
          <span>{t.admin.municipalityCodes.rentSuffix}</span>
        </div>
        {codes.map((row) => (
          <div key={row.id} className="grid grid-cols-4 items-center gap-3 border-b border-black/[.05] px-5 py-3">
            <span className="text-sm font-semibold text-fusiona-black">{row.municipality}</span>
            <input
              value={value(row, 'code')}
              onChange={(e) => updateDraft(row.id, 'code', e.target.value.toUpperCase())}
              maxLength={3}
              className="w-16 rounded-md border border-black/10 px-2.5 py-2 font-mono text-xs font-bold uppercase"
            />
            <input
              value={value(row, 'sale_suffix')}
              onChange={(e) => updateDraft(row.id, 'sale_suffix', e.target.value.toUpperCase())}
              maxLength={2}
              className="w-16 rounded-md border border-black/10 px-2.5 py-2 font-mono text-xs font-bold uppercase"
            />
            <input
              value={value(row, 'rent_suffix')}
              onChange={(e) => updateDraft(row.id, 'rent_suffix', e.target.value.toUpperCase())}
              maxLength={2}
              className="w-16 rounded-md border border-black/10 px-2.5 py-2 font-mono text-xs font-bold uppercase"
            />
          </div>
        ))}
      </div>

      {message && <p className="text-xs font-semibold text-fusiona-black">{message}</p>}

      <button
        type="button"
        disabled={saving || Object.keys(drafts).length === 0}
        onClick={handleSave}
        className="w-fit rounded-[10px] bg-fusiona-red px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white disabled:opacity-40"
      >
        {t.admin.municipalityCodes.save}
      </button>
    </div>
  );
}
