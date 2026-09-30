import i18n from 'i18next';
import { formatDayWithHebrew } from '../../lib/dateFormat';
import type { DayKey } from '../../types/task';

/**
 * A move counts as a postponement (and gets a reschedule note) only when the
 * task moves later than the day it was on. Unscheduled tasks live on today.
 * Pulling a task earlier is planning ahead, not procrastination: no note.
 */
export function isPostponement(from: DayKey | null, to: DayKey | null, today: DayKey): boolean {
  if (to === null) return false;
  return to > (from ?? today);
}

/**
 * Note text in the current app language, e.g.
 * "Rescheduled from Wed, 30 Sep 2026 (19 Tishri 5787) — Reason: waiting on parts".
 */
export function buildRescheduleNote(from: DayKey | null, reason: string, today: DayKey): string {
  const language = i18n.language || 'he';
  const fromDay = formatDayWithHebrew(from ?? today, language);
  const trimmed = reason.trim();
  return trimmed
    ? i18n.t('notes.rescheduledWithReason', { from: fromDay, reason: trimmed })
    : i18n.t('notes.rescheduled', { from: fromDay });
}
