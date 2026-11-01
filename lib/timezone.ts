/**
 * Timezone utilities to ensure shift calculations always respect APP_TIMEZONE
 * regardless of whether the server is running in UTC (Vercel) or local time.
 */

export const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

export interface TimeInZone {
  hours: number;
  minutes: number;
  formatted12h: string;
  timeZone: string;
}

export function getTimeInZone(timeZone: string = DEFAULT_TIMEZONE, date: Date = new Date()): TimeInZone {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    let hours = 0;
    let minutes = 0;
    for (const p of parts) {
      if (p.type === 'hour') hours = parseInt(p.value, 10);
      if (p.type === 'minute') minutes = parseInt(p.value, 10);
    }
    if (hours === 24) hours = 0;

    const h12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formatted12h = `${h12} ${ampm}`;

    return { hours, minutes, formatted12h, timeZone };
  } catch {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const h12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return { hours, minutes, formatted12h: `${h12} ${ampm}`, timeZone };
  }
}

