import { toDayKey } from '../../lib/dayKey';
import {
  TASK_CATEGORIES,
  TASK_SIZES,
  isCompleted,
  type DayKey,
  type Task,
  type TaskCategory,
  type TaskSize,
} from '../../types/task';
import type { DayRange } from '../tasks/selectors';

/** Completion of a set of planned tasks. `rate` is null when nothing was planned. */
export interface RateStat {
  planned: number;
  completed: number;
  rate: number | null;
}

export interface ReflectionSummary {
  /**
   * Execution vs. intention: of the tasks planned for a day in the range,
   * how many are done. Each task counts once, on the day it is planned for
   * now; moving tasks around is surfaced by `postponements` instead.
   */
  execution: RateStat;
  /** Of the completed planned tasks, how many were done on (or before) their day. */
  completedOnPlannedDay: number;
  /** Planned for today and still open: in progress, not failed. */
  openToday: number;
  /** Tasks with no planned day, completed within the range (not part of the ratio). */
  completedUnscheduled: number;
  /** Reschedule notes written within the range, and how many tasks they touch. */
  postponements: { events: number; tasks: number };
  bySize: Record<TaskSize, RateStat>;
  byCategory: Record<TaskCategory, RateStat>;
}

const inRange = (day: DayKey, range: DayRange) => day >= range.start && day < range.end;

function rate(planned: number, completed: number): RateStat {
  return { planned, completed, rate: planned === 0 ? null : completed / planned };
}

function emptyCounts<K extends string>(
  keys: readonly K[],
): Record<K, { planned: number; completed: number }> {
  return Object.fromEntries(keys.map((key) => [key, { planned: 0, completed: 0 }])) as Record<
    K,
    { planned: number; completed: number }
  >;
}

function toRates<K extends string>(
  counts: Record<K, { planned: number; completed: number }>,
): Record<K, RateStat> {
  return Object.fromEntries(
    Object.entries<{ planned: number; completed: number }>(counts).map(([key, c]) => [
      key,
      rate(c.planned, c.completed),
    ]),
  ) as Record<K, RateStat>;
}

/**
 * Everything the dashboard shows, in one pass over the tasks.
 *
 * Honesty rules:
 * - Only tasks planned for a specific day count toward the ratio. An
 *   unscheduled task was never an intention for a day, so it can't be
 *   "missed"; its completions are reported separately.
 * - Today's open tasks count as planned (they are), and `openToday` lets the
 *   UI say "still in progress" instead of implying failure.
 * - Postponements are counted from reschedule notes by when they were
 *   written, so moving a task out of the range can't hide it.
 */
export function summarizeReflection(
  tasks: readonly Task[],
  range: DayRange,
  today: DayKey,
): ReflectionSummary {
  let planned = 0;
  let completed = 0;
  let completedOnPlannedDay = 0;
  let openToday = 0;
  let completedUnscheduled = 0;
  let postponementEvents = 0;
  let postponedTasks = 0;
  const bySize = emptyCounts(TASK_SIZES);
  const byCategory = emptyCounts(TASK_CATEGORIES);

  for (const task of tasks) {
    const done = isCompleted(task);

    const reschedules = task.notes.filter(
      (note) => note.kind === 'reschedule' && inRange(toDayKey(note.createdAt), range),
    ).length;
    postponementEvents += reschedules;
    if (reschedules > 0) postponedTasks += 1;

    if (task.scheduledFor === null) {
      if (done && inRange(toDayKey(task.completedAt as number), range)) completedUnscheduled += 1;
      continue;
    }
    if (!inRange(task.scheduledFor, range)) continue;

    planned += 1;
    bySize[task.size].planned += 1;
    byCategory[task.category].planned += 1;
    if (done) {
      completed += 1;
      bySize[task.size].completed += 1;
      byCategory[task.category].completed += 1;
      if (toDayKey(task.completedAt as number) <= task.scheduledFor) completedOnPlannedDay += 1;
    } else if (task.scheduledFor === today) {
      openToday += 1;
    }
  }

  return {
    execution: rate(planned, completed),
    completedOnPlannedDay,
    openToday,
    completedUnscheduled,
    postponements: { events: postponementEvents, tasks: postponedTasks },
    bySize: toRates(bySize),
    byCategory: toRates(byCategory),
  };
}
