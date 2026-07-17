import { useLocale } from '@/i18n';
import { useVisitRequests } from '@/hooks/useVisitRequests';
import { VisitStatusBadge } from '@/components/StatusBadge';
import { supabase, INE_UPLOADS_BUCKET } from '@/lib/supabaseClient';

export function VisitRequests() {
  const { t, locale } = useLocale();
  const { requests, loading, reload } = useVisitRequests();

  async function viewIne(path: string) {
    const { data, error } = await supabase.storage.from(INE_UPLOADS_BUCKET).createSignedUrl(path, 120);
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function updateStatus(id: string, status: 'confirmada' | 'cancelada') {
    await supabase.from('visit_requests').update({ status }).eq('id', id);
    reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-sans text-2xl font-extrabold uppercase text-fusiona-black">{t.admin.visits.title}</h1>

      <div className="overflow-hidden rounded-[14px] border border-black/[.07] bg-white">
        <div className="grid grid-cols-[1.2fr_1fr_1.3fr_1.3fr_.9fr_1fr_1.4fr] gap-3 border-b border-black/[.06] px-5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-neutral-400">
          <span>{t.admin.visits.name}</span>
          <span>{t.admin.visits.phone}</span>
          <span>{t.admin.visits.property}</span>
          <span>{t.admin.visits.datetime}</span>
          <span>{t.admin.visits.status}</span>
          <span>{t.admin.visits.ine}</span>
          <span />
        </div>

        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">{t.common.loading}</p>
        ) : requests.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">{t.admin.visits.empty}</p>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1.2fr_1fr_1.3fr_1.3fr_.9fr_1fr_1.4fr] items-center gap-3 border-b border-black/[.05] px-5 py-3.5 text-[12.5px] font-medium text-neutral-600"
            >
              <span className="font-semibold text-fusiona-black">{r.client_name}</span>
              <span>{r.client_phone}</span>
              <span className="truncate">
                {r.property?.folio} — {r.property?.title}
              </span>
              <span>
                {new Date(r.requested_datetime).toLocaleString(locale === 'en' ? 'en-US' : 'es-MX', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
              <span className="w-fit">
                <VisitStatusBadge status={r.status} />
              </span>
              <span className="flex gap-2">
                <button type="button" onClick={() => viewIne(r.ine_front_path)} className="text-[11.5px] font-bold text-fusiona-red">
                  {t.admin.visits.viewIne}
                </button>
              </span>
              <span className="flex gap-2.5 text-[11.5px] font-bold">
                {r.status !== 'confirmada' && (
                  <button type="button" onClick={() => updateStatus(r.id, 'confirmada')} className="text-[#217A3C]">
                    {t.admin.visits.confirm}
                  </button>
                )}
                {r.status !== 'cancelada' && (
                  <button type="button" onClick={() => updateStatus(r.id, 'cancelada')} className="text-neutral-400">
                    {t.admin.visits.cancel}
                  </button>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
