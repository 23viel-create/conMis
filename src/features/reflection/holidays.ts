import { addDaysToKey, dayKeyToDate } from '../../lib/dayKey';
import type { DayKey } from '../../types/task';
import type { DayRange } from '../tasks/selectors';

export const HOLIDAYS = [
  'roshHashanah',
  'yomKippur',
  'sukkot',
  'sheminiAtzeret',
  'chanukah',
  'purim',
  'pesach',
  'shavuot',
] as const;
export type HolidayId = (typeof HOLIDAYS)[number];

export interface HolidayInRange {
  id: HolidayId;
  /** First and last day of the holiday that fall inside the range. */
  first: DayKey;
  last: DayKey;
}

interface HebrewDate {
  month: string; // Intl's English month name, e.g. "Tishri", "Adar II"
  day: number;
}

/** Longest range scanned (~10 years), so "All time" stays cheap. */
const MAX_DAYS = 3700;

function makeHebrewDateReader(): ((day: DayKey) => HebrewDate) | null {
  try {
    const format = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long' });
    if (format.resolvedOptions().calendar !== 'hebrew') return null;
    return (day) => {
      const parts = format.formatToParts(dayKeyToDate(day));
      return {
        month: parts.find((part) => part.type === 'month')?.value ?? '',
        day: Number(parts.find((part) => part.type === 'day')?.value),
      };
    };
  } catch {
    return null;
  }
}

/**
 * Major holidays by the Israeli calendar (one day of Shavuot, Shemini Atzeret
 * together with Simchat Torah). Chanukah spans the Kislev/Tevet boundary, so
 * it is found by looking back for 25 Kislev.
 */
function holidayOn(day: DayKey, read: (day: DayKey) => HebrewDate): HolidayId | null {
  const { month, day: d } = read(day);
  switch (month) {
    case 'Tishri':
      if (d <= 2) return 'roshHashanah';
      if (d === 10) return 'yomKippur';
      if (d >= 15 && d <= 21) return 'sukkot';
      if (d === 22) return 'sheminiAtzeret';
      return null;
    case 'Kislev':
      return d >= 25 ? 'chanukah' : null;
    case 'Tevet':
      for (let back = 1; back <= 7; back += 1) {
        const earlier = read(addDaysToKey(day, -back));
        if (earlier.month === 'Kislev' && earlier.day === 25) return 'chanukah';
      }
      return null;
    case 'Adar':
    case 'Adar II':
      return d === 14 ? 'purim' : null;
    case 'Nisan':
      return d >= 15 && d <= 21 ? 'pesach' : null;
    case 'Sivan':
      return d === 6 ? 'shavuot' : null;
    default:
      return null;
  }
}

/**
 * Holidays that overlap the range, in date order. Returns [] when the JS
 * engine can't convert to the Hebrew calendar, so the UI simply omits the note.
 */
export function findHolidays(range: DayRange): HolidayInRange[] {
  const read = makeHebrewDateReader();
  if (!read) return [];

  const found: HolidayInRange[] = [];
  let day = range.start;
  for (let i = 0; day < range.end && i < MAX_DAYS; i += 1, day = addDaysToKey(day, 1)) {
    const id = holidayOn(day, read);
    if (!id) continue;
    const current = found[found.length - 1];
    if (current && current.id === id && addDaysToKey(current.last, 1) === day) current.last = day;
    else found.push({ id, first: day, last: day });
  }
  return found;
}
