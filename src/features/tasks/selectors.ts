import type { DayKey, Note, Task } from '../../types/task';

/** Half-open range of calendar days: start <= day < end. */
export interface DayRange {
  start: DayKey;
  end: DayKey;
}

/**
 * The day a task appears on. Unscheduled tasks (including everything saved
 * before scheduling existed) surface on today, so they are never invisible.
 */
export function effectiveDay(task: Task, today: DayKey): DayKey {
  return task.scheduledFor ?? today;
}

/**
 * Tasks whose effective day falls inside `range`, ordered by day (for the
 * week view), then newest first. Completion does not change position, so a
 * task doesn't jump away from under the user's finger when it's checked off.
 */
export function selectTasksInRange(
  tasks: readonly Task[],
  range: DayRange,
  today: DayKey,
): Task[] {
  return tasks
    .filter((task) => {
      const day = effectiveDay(task, today);
      return day >= range.start && day < range.end;
    })
    .sort((a, b) => {
      const dayA = effectiveDay(a, today);
      const dayB = effectiveDay(b, today);
      if (dayA !== dayB) return dayA < dayB ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
}

export type NoteOrder = 'newest' | 'oldest';

/** Pinned notes first, then the rest; both groups follow `order`. */
export function sortNotes(notes: readonly Note[], order: NoteOrder): Note[] {
  const byTime = (a: Note, b: Note) =>
    order === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
  return [
    ...notes.filter((note) => note.isPinned).sort(byTime),
    ...notes.filter((note) => !note.isPinned).sort(byTime),
  ];
}

/** Note shown under the title in lists: newest pinned note, else newest note. */
export function previewNote(task: Task): Note | undefined {
  return sortNotes(task.notes, 'newest')[0];
}
