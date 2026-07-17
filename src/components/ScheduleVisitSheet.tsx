import { useEffect, useState } from 'react';
import { useLocale } from '@/i18n';
import { supabase, INE_UPLOADS_BUCKET } from '@/lib/supabaseClient';
import { upcomingDays, DEFAULT_TIME_SLOTS } from '@/lib/dates';
import type { PropertyRow } from '@/types/database';

interface ScheduleVisitSheetProps {
  property: PropertyRow;
  onClose: () => void;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ScheduleVisitSheet({ property, onClose }: ScheduleVisitSheetProps) {
  const { locale, t } = useLocale();
  const days = upcomingDays(5, locale);
  const [selectedDay, setSelectedDay] = useState(days[0]?.iso);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ineFront, setIneFront] = useState<File | null>(null);
  const [ineBack, setIneBack] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDay) return;
    let cancelled = false;

    async function loadAvailability() {
      try {
        const res = await fetch(`/api/calendar/availability?date=${selectedDay}`);
        if (!res.ok) throw new Error('unavailable');
        const data = (await res.json()) as { slots: string[] };
        if (!cancelled && Array.isArray(data.slots) && data.slots.length > 0) {
          setAvailableSlots(data.slots);
          return;
        }
      } catch {
        // Calendar integration not configured yet — fall back to default slots.
      }
      if (!cancelled) setAvailableSlots(DEFAULT_TIME_SLOTS);
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [selectedDay]);

  const canSubmit = selectedDay && selectedTime && name.trim() && phone.trim() && ineFront && ineBack;

  async function handleSubmit() {
    if (!canSubmit) {
      setFormError(t.visit.requiredFields);
      return;
    }
    setFormError(null);
    setStatus('submitting');

    try {
      const visitId = crypto.randomUUID();
      const frontExt = ineFront!.name.split('.').pop() ?? 'jpg';
      const backExt = ineBack!.name.split('.').pop() ?? 'jpg';
      const frontPath = `${visitId}/front.${frontExt}`;
      const backPath = `${visitId}/back.${backExt}`;

      const [frontUpload, backUpload] = await Promise.all([
        supabase.storage.from(INE_UPLOADS_BUCKET).upload(frontPath, ineFront!, { upsert: false }),
        supabase.storage.from(INE_UPLOADS_BUCKET).upload(backPath, ineBack!, { upsert: false }),
      ]);

      if (frontUpload.error) throw frontUpload.error;
      if (backUpload.error) throw backUpload.error;

      const requestedDatetime = new Date(`${selectedDay}T${selectedTime}:00`);

      const { error: insertError } = await supabase.from('visit_requests').insert({
        id: visitId,
        property_id: property.id,
        client_name: name.trim(),
        client_phone: phone.trim(),
        requested_datetime: requestedDatetime.toISOString(),
        ine_front_path: frontPath,
        ine_back_path: backPath,
        status: 'pendiente',
      });

      if (insertError) throw insertError;

      fetch('/api/notify-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId }),
      }).catch(() => {
        // Best-effort notification — the request is already saved.
      });

      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[22px] bg-white p-5 pb-7 sm:rounded-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/15 sm:hidden" />

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <h3 className="font-sans text-xl font-extrabold uppercase text-fusiona-black">{t.visit.title}</h3>
            <p className="text-sm font-medium text-neutral-600">{t.visit.success}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-fusiona-black px-6 py-3 text-sm font-bold uppercase text-white"
            >
              {t.visit.close}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-sans text-xl font-extrabold uppercase text-fusiona-black">{t.visit.title}</h3>
                <span className="text-xs font-medium text-neutral-500">
                  {property.folio} · {property.title}
                </span>
              </div>
              <button type="button" onClick={onClose} className="text-sm font-semibold text-neutral-400">
                {t.visit.close}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t.visit.date}</span>
              <div className="flex gap-2 overflow-x-auto text-center text-sm font-semibold">
                {days.map((day) => (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day.iso);
                      setSelectedTime(undefined);
                    }}
                    className={`flex-1 rounded-xl px-2 py-2.5 transition-colors ${
                      selectedDay === day.iso
                        ? 'bg-fusiona-black text-white'
                        : 'border border-black/10 text-neutral-600'
                    }`}
                  >
                    {day.dayLabel}
                    <br />
                    <strong className="text-[15px]">{day.dayNumber}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t.visit.time}</span>
              <div className="flex flex-wrap gap-2 text-sm font-semibold">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-xl px-3.5 py-2.5 transition-colors ${
                      selectedTime === slot ? 'bg-fusiona-black text-white' : 'border border-black/10 text-neutral-600'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                {t.visit.yourInfo}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.visit.fullName}
                className="rounded-xl border border-black/10 px-3.5 py-3 text-sm font-medium outline-none focus:border-fusiona-black"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.visit.phone}
                type="tel"
                className="rounded-xl border border-black/10 px-3.5 py-3 text-sm font-medium outline-none focus:border-fusiona-black"
              />
            </div>

            <div className="rounded-xl bg-fusiona-cream p-3 text-[11.5px] font-medium leading-relaxed text-neutral-600">
              {t.visit.ineNotice}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FileField label={t.visit.ineFront} file={ineFront} onChange={setIneFront} uploadLabel={t.visit.uploadPhoto} />
              <FileField label={t.visit.ineBack} file={ineBack} onChange={setIneBack} uploadLabel={t.visit.uploadPhoto} />
            </div>

            <p className="text-[11px] leading-relaxed text-neutral-400">{t.visit.privacyNote}</p>

            {formError && <p className="text-[12px] font-semibold text-fusiona-red">{formError}</p>}
            {status === 'error' && <p className="text-[12px] font-semibold text-fusiona-red">{t.visit.error}</p>}

            <button
              type="button"
              disabled={status === 'submitting'}
              onClick={handleSubmit}
              className="flex items-center justify-center rounded-xl bg-fusiona-red py-4 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-fusiona-red-dark disabled:opacity-60"
            >
              {status === 'submitting'
                ? t.visit.submitting
                : `${t.visit.confirm}${selectedDay && selectedTime ? ` — ${selectedTime}` : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FileField({
  label,
  file,
  onChange,
  uploadLabel,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  uploadLabel: string;
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-dashed border-black/20 p-3 text-center">
      <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="text-xs font-semibold text-neutral-600">
        {file ? file.name : uploadLabel}
      </span>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
