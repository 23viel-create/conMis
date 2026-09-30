import type { DayKey } from '../types/task';
import { dayKeyToDate } from './dayKey';

/** e.g. "Wed, 30 Sep 2026" / "יום ד׳, 30 בספט׳ 2026". */
export function formatDay(day: DayKey, language: string): string {
  return new Intl.DateTimeFormat(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dayKeyToDate(day));
}

/**
 * The same day in the Hebrew calendar, e.g. "19 Tishri 5787" / "19 בתשרי 5787",
 * via Intl's built-in Hebrew calendar (no extra dependency). Returns null when
 * the JS engine can't do calendar conversion, so callers can omit it instead
 * of showing a wrong date.
 */
export function formatHebrewDay(day: DayKey, language: string): string | null {
  try {
    const format = new Intl.DateTimeFormat(`${language}-u-ca-hebrew`, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (format.resolvedOptions().calendar !== 'hebrew') return null;
    return format.format(dayKeyToDate(day));
  } catch {
    return null;
  }
}

/** "Wed, 30 Sep 2026 (19 Tishri 5787)", or just the Gregorian part. */
export function formatDayWithHebrew(day: DayKey, language: string): string {
  const hebrew = formatHebrewDay(day, language);
  const gregorian = formatDay(day, language);
  return hebrew ? `${gregorian} (${hebrew})` : gregorian;
}
