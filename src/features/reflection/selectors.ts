import { addDaysToKey, dayKeyToDate, toDayKey } from '../../lib/dayKey';
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
import { WEEK_STARTS_ON } from '../calendar/timeline';

/** Completion of a set of planned tasks. `rate` is null when nothing was planned. */
export interface RateStat {
  planned: number;
  completed: number;
  rate: number | null;
}

export interface ReflectionSummary {
  /**
   * Execution vs. intention: of the tasks first intended for a day in the
   * range (`originalScheduledFor`), how many are done. Postponing doesn't
   * move a task out of the day it was first meant for.
   */
  execution: RateStat;
  /** Of those, how many were done on (or before) the intended day. */
  completedOnPlannedDay: number;
  /** Intended for today and still open: in progress, not failed. */
  openToday: number;
  /** Tasks with no planned day, completed within the range (not part of the ratio). */
  completedUnscheduled: number;
  /** Reschedule notes written within the range, and how many tasks they touch. */
  postponements: { events: number; tasks: number };
  bySize: Record<TaskSize, RateStat>;
  byCategory: Record<TaskCategory, RateStat>;
}

const inRange = (day: DayKey, range: DayRange) => day >= range.start && day < range.end;

/** Done on or before the day it was intended for. */
const isOnTime = (task: Task, intended: DayKey) =>
  task.completedAt !== null && toDayKey(task.completedAt) <= intended;

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
 * - A task counts on its intended day (`originalScheduledFor`), so pushing
 *   it to later can't remove a missed intention from the record.
 * - Only tasks intended for a specific day count toward the ratio. An
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

    const intended = task.originalScheduledFor;
    if (intended === null) {
      if (done && inRange(toDayKey(task.completedAt as number), range)) completedUnscheduled += 1;
      continue;
    }
    if (!inRange(intended, range)) continue;

    planned += 1;
    bySize[task.size].planned += 1;
    byCategory[task.category].planned += 1;
    if (done) {
      completed += 1;
      bySize[task.size].completed += 1;
      byCategory[task.category].completed += 1;
      if (isOnTime(task, intended)) completedOnPlannedDay += 1;
    } else if (intended === today) {
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

/* ------------------------------------------------------------- Trends */

/** One bar of the trend chart: intentions for a day (or week) kept on time. */
export interface TrendBar {
  /** First day the bar covers. */
  start: DayKey;
  /** Days covered: 1 for daily bars, up to 7 for weekly bars. */
  days: number;
  /** Tasks intended for these days. */
  planned: number;
  /** Of those, done on or before their intended day. */
  onTime: number;
  rate: number | null;
  /** Covers today, which isn't over yet. */
  inProgress: boolean;
}

/** Daily bars up to this many days; longer periods are grouped by week. */
export const MAX_DAILY_BARS = 45;

function countIntentions(tasks: readonly Task[], range: DayRange) {
  const byDay = new Map<DayKey, { planned: number; onTime: number }>();
  for (const task of tasks) {
    const intended = task.originalScheduledFor;
    if (intended === null || !inRange(intended, range)) continue;
    const entry = byDay.get(intended) ?? { planned: 0, onTime: 0 };
    entry.planned += 1;
    if (isOnTime(task, intended)) entry.onTime += 1;
    byDay.set(intended, entry);
  }
  return byDay;
}

/**
 * On-time execution per day across the range, oldest first. Uses the
 * intended day, so a task pushed from Monday to Thursday stays a miss on
 * Monday (and doesn't count as a Thursday intention). Long ranges are
 * grouped into weeks starting on WEEK_STARTS_ON.
 */
export function selectTrend(tasks: readonly Task[], range: DayRange, today: DayKey): TrendBar[] {
  const byDay = countIntentions(tasks, range);
  const days: DayKey[] = [];
  for (let day = range.start; day < range.end; day = addDaysToKey(day, 1)) days.push(day);

  const weekly = days.length > MAX_DAILY_BARS;
  const bars: TrendBar[] = [];
  for (const day of days) {
    const startsWeek = dayKeyToDate(day).getDay() === WEEK_STARTS_ON;
    const current = bars[bars.length - 1];
    const bar =
      !weekly || !current || startsWeek || current.days === 7
        ? { start: day, days: 0, planned: 0, onTime: 0, rate: null, inProgress: false }
        : current;
    if (bar !== current) bars.push(bar);
    const counts = byDay.get(day);
    bar.days += 1;
    bar.planned += counts?.planned ?? 0;
    bar.onTime += counts?.onTime ?? 0;
    bar.inProgress ||= day === today;
  }
  for (const bar of bars) bar.rate = bar.planned === 0 ? null : bar.onTime / bar.planned;
  return bars;
}

export interface WeekdayBar {
  /** 0 = Sunday ... 6 = Saturday. */
  weekday: number;
  planned: number;
  onTime: number;
  rate: number | null;
}

/**
 * Average on-time execution per day of week, in week order (Sunday first).
 * Today is left out: its tasks are still in progress and would drag its
 * weekday down unfairly.
 */
export function selectWeekdayTrend(
  tasks: readonly Task[],
  range: DayRange,
  today: DayKey,
): WeekdayBar[] {
  const byDay = countIntentions(tasks, {
    start: range.start,
    end: today < range.end ? today : range.end,
  });
  const bars: WeekdayBar[] = Array.from({ length: 7 }, (_, i) => ({
    weekday: (WEEK_STARTS_ON + i) % 7,
    planned: 0,
    onTime: 0,
    rate: null,
  }));
  for (const [day, counts] of byDay) {
    const bar = bars[(dayKeyToDate(day).getDay() - WEEK_STARTS_ON + 7) % 7];
    bar.planned += counts.planned;
    bar.onTime += counts.onTime;
  }
  for (const bar of bars) bar.rate = bar.planned === 0 ? null : bar.onTime / bar.planned;
  return bars;
}
