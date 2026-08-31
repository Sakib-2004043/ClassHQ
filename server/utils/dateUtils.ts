// Comprehensive Timezone and Date Synchronization Utilities for ClassHQ
// Default Timezone: Asia/Dhaka (Bangladesh Standard Time, GMT+6)

export const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Dhaka';

export interface ZonedDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
}

/**
 * Extracts accurate date and time components in the specified timezone.
 */
export function getZonedDateParts(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): ZonedDateParts {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(date);
    const map: Record<string, string> = {};
    parts.forEach((p) => {
      map[p.type] = p.value;
    });

    const year = parseInt(map.year, 10) || date.getUTCFullYear();
    const month = parseInt(map.month, 10) || date.getUTCMonth() + 1;
    const day = parseInt(map.day, 10) || date.getUTCDate();
    const hour = parseInt(map.hour, 10) || 0;
    const minute = parseInt(map.minute, 10) || 0;
    const second = parseInt(map.second, 10) || 0;

    // Day of week mapping
    const weekdayStr = map.weekday || '';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = weekdays.indexOf(weekdayStr) !== -1 ? weekdays.indexOf(weekdayStr) : new Date(year, month - 1, day).getDay();

    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      dayOfWeek,
    };
  } catch (err) {
    // Fallback in case of invalid timezone
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      dayOfWeek: date.getDay(),
    };
  }
}

/**
 * Returns formatted "YYYY-MM-DD" string for the given date in the target timezone.
 */
export function getZonedDateString(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): string {
  const parts = getZonedDateParts(date, timeZone);
  const y = parts.year;
  const m = String(parts.month).padStart(2, '0');
  const d = String(parts.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns formatted 12-hour time string "hh:mm AM/PM" in the target timezone.
 */
export function getZonedTimeString(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): string {
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    const parts = getZonedDateParts(date, timeZone);
    const h12 = parts.hour % 12 || 12;
    const ampm = parts.hour >= 12 ? 'PM' : 'AM';
    return `${String(h12).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')} ${ampm}`;
  }
}

/**
 * Returns total minutes since midnight (0 to 1439) in the target timezone.
 */
export function getZonedMinutes(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): number {
  const parts = getZonedDateParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

/**
 * Parse time string like "3:00 PM" or "12:05 AM" to hours (0-23) and minutes (0-59).
 */
export function parseTime(timeStr: string): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 15, minutes: 0 };
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return { hours: 15, minutes: 0 };
  let [_, h, m, p] = match;
  let hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);
  if (p) {
    const period = p.toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }
  return { hours, minutes };
}

/**
 * Checks if current time is within [startStr, endStr] window in the target timezone.
 */
export function isTimeWithinWindow(
  date: Date = new Date(),
  startStr: string = '12:05 AM',
  endStr: string = '11:55 PM',
  timeZone: string = DEFAULT_TIMEZONE
): boolean {
  const start = parseTime(startStr);
  const end = parseTime(endStr);
  const nowMins = getZonedMinutes(date, timeZone);

  const startMins = start.hours * 60 + start.minutes;
  const endMins = end.hours * 60 + end.minutes;

  if (startMins < endMins) {
    return nowMins >= startMins && nowMins <= endMins;
  } else {
    // Window crosses midnight (e.g. 3:00 PM to 12:00 AM)
    return nowMins >= startMins || (endMins > 0 && nowMins < endMins);
  }
}

/**
 * Calculates the next academic working day (skipping Friday=5 and Saturday=6).
 */
export function getNextAcademicDate(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): string {
  const parts = getZonedDateParts(date, timeZone);
  const d = new Date(parts.year, parts.month - 1, parts.day + 1);
  while (d.getDay() === 5 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
