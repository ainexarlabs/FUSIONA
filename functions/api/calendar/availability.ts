import { getAvailableSlots, type CalendarEnv } from '../../_lib/googleCalendar';

interface Env extends CalendarEnv {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response(JSON.stringify({ error: 'invalid_date' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slots = await getAvailableSlots(context.env, date);

  return new Response(JSON.stringify({ slots }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
