import { createClient } from '@supabase/supabase-js';
import { createCalendarEvent, isSlotAvailable, type CalendarEnv } from '../_lib/googleCalendar';

interface Env extends CalendarEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL_TO?: string;
  NOTIFY_EMAIL_FROM?: string;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  let visitId: string | undefined;
  try {
    const body = (await request.json()) as { visitId?: string };
    visitId = body.visitId;
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  if (!visitId) return json({ error: 'missing_visit_id' }, 400);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'not_configured' }, 501);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: visit, error: visitError } = await supabase
    .from('visit_requests')
    .select('*, property:properties(folio, title, municipality)')
    .eq('id', visitId)
    .single();

  if (visitError || !visit) return json({ error: 'visit_not_found' }, 404);

  const property = visit.property as { folio: string; title: string; municipality: string } | null;

  const [frontSigned, backSigned] = await Promise.all([
    supabase.storage.from('ine-uploads').createSignedUrl(visit.ine_front_path, SIGNED_URL_TTL_SECONDS),
    supabase.storage.from('ine-uploads').createSignedUrl(visit.ine_back_path, SIGNED_URL_TTL_SECONDS),
  ]);

  let calendarEventId: string | null = null;
  let confirmed = false;

  if (env.GOOGLE_CALENDAR_ID) {
    const available = await isSlotAvailable(env, visit.requested_datetime);
    if (available) {
      calendarEventId = await createCalendarEvent(env, {
        summary: `Visita ${property?.folio ?? ''} — ${visit.client_name}`,
        description: `Cliente: ${visit.client_name}\nTeléfono: ${visit.client_phone}\nPropiedad: ${property?.title ?? ''} (${property?.folio ?? ''})`,
        startIso: visit.requested_datetime,
      });
      confirmed = Boolean(calendarEventId);
    }
  }

  if (confirmed && calendarEventId) {
    await supabase
      .from('visit_requests')
      .update({ status: 'confirmada', calendar_event_id: calendarEventId })
      .eq('id', visitId);
  }

  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL_TO && env.NOTIFY_EMAIL_FROM) {
    await sendNotificationEmail(env, {
      visit,
      property,
      frontUrl: frontSigned.data?.signedUrl,
      backUrl: backSigned.data?.signedUrl,
      confirmed,
    });
  }

  return json({ ok: true, confirmed });
};

async function sendNotificationEmail(
  env: Env,
  params: {
    visit: { client_name: string; client_phone: string; requested_datetime: string };
    property: { folio: string; title: string; municipality: string } | null;
    frontUrl?: string;
    backUrl?: string;
    confirmed: boolean;
  },
) {
  const { visit, property, frontUrl, backUrl, confirmed } = params;
  const when = new Date(visit.requested_datetime).toLocaleString('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  });

  const html = `
    <h2>Nueva solicitud de visita — ${escapeHtml(property?.folio ?? '')}</h2>
    <p><strong>Propiedad:</strong> ${escapeHtml(property?.title ?? '')} (${escapeHtml(property?.municipality ?? '')})</p>
    <p><strong>Cliente:</strong> ${escapeHtml(visit.client_name)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(visit.client_phone)}</p>
    <p><strong>Fecha solicitada:</strong> ${escapeHtml(when)}</p>
    <p><strong>Estatus:</strong> ${confirmed ? 'Confirmada automáticamente en Google Calendar' : 'Pendiente de confirmación manual'}</p>
    <p><strong>Identificación (INE):</strong></p>
    <ul>
      ${frontUrl ? `<li><a href="${frontUrl}">Frente (enlace válido 7 días)</a></li>` : ''}
      ${backUrl ? `<li><a href="${backUrl}">Reverso (enlace válido 7 días)</a></li>` : ''}
    </ul>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.NOTIFY_EMAIL_FROM,
      to: env.NOTIFY_EMAIL_TO,
      subject: `Solicitud de visita — ${property?.folio ?? 'propiedad'}`,
      html,
    }),
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
