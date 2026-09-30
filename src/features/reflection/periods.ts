import { addDaysToKey, dayKeyToDate, toDayKey } from '../../lib/dayKey';
import type { DayKey, Task } from '../../types/task';
// Pure module import (not the calendar index) so this stays testable without React Native.
import { WEEK_STARTS_ON } from '../calendar/timeline';
import type { DayRange } from '../tasks/selectors';

export const REFLECTION_PERIODS = [
  'currentWeek',
  'last7',
  'last30',
  'month',
  'all',
  'weekday',
] as const;
export type ReflectionPeriod = (typeof REFLECTION_PERIODS)[number];

/**
 * Days a period covers, up to and including today. Future days are never
 * included: tasks planned for later haven't had their chance yet.
 *   currentWeek = start of this week (Sunday) to today
 *   last7       = today and the 6 days before it
 *   last30      = today and the 29 days before it
 *   month       = the 1st of this month to today
 *   all/weekday = the first day anything was planned or created, to today
 *                 ("weekday" is all time, grouped by day of week)
 */
export function getPeriodRange(
  period: ReflectionPeriod,
  today: DayKey,
  tasks: readonly Task[],
): DayRange {
  const end = addDaysToKey(today, 1);
  switch (period) {
    case 'currentWeek': {
      const offset = (dayKeyToDate(today).getDay() - WEEK_STARTS_ON + 7) % 7;
      return { start: addDaysToKey(today, -offset), end };
    }
    case 'last7':
      return { start: addDaysToKey(today, -6), end };
    case 'last30':
      return { start: addDaysToKey(today, -29), end };
    case 'month':
      return { start: `${today.slice(0, 7)}-01`, end };
    case 'all':
    case 'weekday': {
      let start = today;
      for (const task of tasks) {
        const created = toDayKey(task.createdAt);
        if (created < start) start = created;
        for (const day of [task.scheduledFor, task.originalScheduledFor]) {
          if (day !== null && day < start) start = day;
        }
      }
      return { start, end };
    }
  }
}
