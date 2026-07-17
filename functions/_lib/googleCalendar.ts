import { getGoogleAccessToken } from './googleAuth';

export interface CalendarEnv {
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  GOOGLE_CALENDAR_ID?: string;
}

export const DEFAULT_SLOTS = ['10:00', '12:00', '16:00', '18:00'];
const VISIT_DURATION_MINUTES = 60;
const TIMEZONE = 'America/Mexico_City';

async function calendarToken(env: CalendarEnv) {
  return getGoogleAccessToken(env, 'https://www.googleapis.com/auth/calendar');
}

export async function getAvailableSlots(env: CalendarEnv, dateIso: string): Promise<string[]> {
  const token = await calendarToken(env);
  const calendarId = env.GOOGLE_CALENDAR_ID;
  if (!token || !calendarId) return DEFAULT_SLOTS;

  const dayStart = new Date(`${dateIso}T00:00:00-06:00`);
  const dayEnd = new Date(`${dateIso}T23:59:59-06:00`);

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      timeZone: TIMEZONE,
      items: [{ id: calendarId }],
    }),
  });

  if (!res.ok) return DEFAULT_SLOTS;

  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
  };
  const busy = data.calendars?.[calendarId]?.busy ?? [];

  return DEFAULT_SLOTS.filter((slot) => {
    const slotStart = new Date(`${dateIso}T${slot}:00-06:00`);
    const slotEnd = new Date(slotStart.getTime() + VISIT_DURATION_MINUTES * 60_000);
    return !busy.some((b) => {
      const busyStart = new Date(b.start);
      const busyEnd = new Date(b.end);
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  });
}

export async function isSlotAvailable(env: CalendarEnv, startIso: string): Promise<boolean> {
  const token = await calendarToken(env);
  const calendarId = env.GOOGLE_CALENDAR_ID;
  if (!token || !calendarId) return false;

  const start = new Date(startIso);
  const end = new Date(start.getTime() + VISIT_DURATION_MINUTES * 60_000);

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      timeZone: TIMEZONE,
      items: [{ id: calendarId }],
    }),
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { calendars?: Record<string, { busy?: unknown[] }> };
  return (data.calendars?.[calendarId]?.busy?.length ?? 0) === 0;
}

export async function createCalendarEvent(
  env: CalendarEnv,
  params: { summary: string; description: string; startIso: string },
): Promise<string | null> {
  const token = await calendarToken(env);
  const calendarId = env.GOOGLE_CALENDAR_ID;
  if (!token || !calendarId) return null;

  const start = new Date(params.startIso);
  const end = new Date(start.getTime() + VISIT_DURATION_MINUTES * 60_000);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: params.summary,
        description: params.description,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
      }),
    },
  );

  if (!res.ok) return null;
  const data = (await res.json()) as { id?: string };
  return data.id ?? null;
}
