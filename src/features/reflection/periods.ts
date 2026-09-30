import { addDaysToKey, toDayKey } from '../../lib/dayKey';
import type { DayKey, Task } from '../../types/task';
import type { DayRange } from '../tasks/selectors';

export const REFLECTION_PERIODS = ['week', 'month', 'all'] as const;
export type ReflectionPeriod = (typeof REFLECTION_PERIODS)[number];

/**
 * Days a period covers, up to and including today. Future days are never
 * included: tasks planned for later haven't had their chance yet.
 *   week  = the last 7 days (today and the 6 before it)
 *   month = the 1st of this month to today
 *   all   = the first day anything was planned or created, to today
 */
export function getPeriodRange(
  period: ReflectionPeriod,
  today: DayKey,
  tasks: readonly Task[],
): DayRange {
  const end = addDaysToKey(today, 1);
  switch (period) {
    case 'week':
      return { start: addDaysToKey(today, -6), end };
    case 'month':
      return { start: `${today.slice(0, 7)}-01`, end };
    case 'all': {
      let start = today;
      for (const task of tasks) {
        const created = toDayKey(task.createdAt);
        if (created < start) start = created;
        if (task.scheduledFor !== null && task.scheduledFor < start) start = task.scheduledFor;
      }
      return { start, end };
    }
  }
}
