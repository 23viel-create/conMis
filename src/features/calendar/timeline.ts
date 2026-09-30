import type { Timestamp } from '../../types/task';

export const TIMELINE_VIEWS = ['yesterday', 'today', 'tomorrow', 'week'] as const;
export type TimelineView = (typeof TIMELINE_VIEWS)[number];

/** Half-open interval in local time: start <= t < end. */
export interface DateRange {
  start: Timestamp;
  end: Timestamp;
}

/** 0 = Sunday, as in Israel (and the US). */
export const WEEK_STARTS_ON = 0;

function startOfDay(ts: Timestamp): Date {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d;
}

// setDate() (not +24h) so days stay correct across DST changes.
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Resolves a view to concrete dates relative to `now`. Views are stored, not
 * dates, so "Today" stays correct after midnight without touching the store.
 */
export function getViewRange(
  view: TimelineView,
  now: Timestamp = Date.now(),
  weekStartsOn: number = WEEK_STARTS_ON,
): DateRange {
  const today = startOfDay(now);
  let start: Date;
  let days = 1;

  switch (view) {
    case 'yesterday':
      start = addDays(today, -1);
      break;
    case 'today':
      start = today;
      break;
    case 'tomorrow':
      start = addDays(today, 1);
      break;
    case 'week':
      start = addDays(today, -((today.getDay() - weekStartsOn + 7) % 7));
      days = 7;
      break;
  }

  return { start: start.getTime(), end: addDays(start, days).getTime() };
}

export function isInRange(ts: Timestamp, range: DateRange): boolean {
  return ts >= range.start && ts < range.end;
}
