import type { DayKey, Timestamp } from '../types/task';

const DAY_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day of a moment, e.g. 2026-09-30. */
export function toDayKey(moment: Timestamp | Date = Date.now()): DayKey {
  const d = new Date(moment);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight at the start of the given day. */
export function dayKeyToDate(key: DayKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysToKey(key: DayKey, days: number): DayKey {
  const d = dayKeyToDate(key);
  d.setDate(d.getDate() + days); // setDate, not +24h: DST-safe
  return toDayKey(d);
}

export function isDayKey(value: unknown): value is DayKey {
  return typeof value === 'string' && DAY_KEY_PATTERN.test(value);
}
