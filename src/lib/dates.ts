const DAY_LABELS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface DayOption {
  date: Date;
  iso: string;
  dayLabel: string;
  dayNumber: number;
}

export function upcomingDays(count: number, locale: 'es' | 'en'): DayOption[] {
  const labels = locale === 'en' ? DAY_LABELS_EN : DAY_LABELS_ES;
  const days: DayOption[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= count; i += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    days.push({
      date,
      iso: date.toISOString().slice(0, 10),
      dayLabel: labels[date.getDay()],
      dayNumber: date.getDate(),
    });
  }
  return days;
}

export const DEFAULT_TIME_SLOTS = ['10:00', '12:00', '16:00', '18:00'];
