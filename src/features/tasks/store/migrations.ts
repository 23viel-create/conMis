import { isDayKey } from '../../../lib/dayKey';
import type { Note, Task } from '../../../types/task';

/** Current persisted shape. Bump STORAGE_VERSION whenever it changes. */
export interface PersistedTasks {
  tasks: Task[];
}

export const STORAGE_VERSION = 3;

/** v1: no scheduledFor. */
type TaskV1 = Omit<Task, 'scheduledFor' | 'notes'> & { notes: string };
/** v2: scheduledFor added; notes still a single string. */
type TaskV2 = Omit<Task, 'notes'> & { notes: unknown };

/**
 * v2 -> v3: the single notes string becomes a one-item notes log. Blank
 * notes become an empty log. The note id is derived from the task id so the
 * migration is deterministic and doesn't depend on crypto being available.
 */
function notesFromV2(task: TaskV2): Note[] {
  if (typeof task.notes !== 'string' || task.notes.trim() === '') return [];
  return [
    {
      id: `${task.id}-note-0`,
      content: task.notes.trim(),
      createdAt: task.createdAt,
      isPinned: false,
      kind: 'user',
    },
  ];
}

/**
 * Upgrades a saved snapshot from any older version, one step at a time.
 * Must never throw: a failed migration would leave the user with no tasks.
 */
export function migrateTasks(persisted: unknown, fromVersion: number): PersistedTasks {
  const raw = (persisted ?? {}) as { tasks?: unknown };
  let tasks: unknown[] = Array.isArray(raw.tasks) ? raw.tasks : [];

  if (fromVersion < 2) {
    tasks = (tasks as TaskV1[]).map((task) => ({ ...task, scheduledFor: null }));
  }
  if (fromVersion < 3) {
    tasks = (tasks as TaskV2[]).map((task) => ({ ...task, notes: notesFromV2(task) }));
  }

  // Defensive: repair fields that would break filtering or rendering.
  return {
    tasks: (tasks as Task[]).map((task) => ({
      ...task,
      scheduledFor: isDayKey(task.scheduledFor) ? task.scheduledFor : null,
      notes: Array.isArray(task.notes) ? task.notes : [],
    })),
  };
}
