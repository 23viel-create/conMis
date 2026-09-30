import { isDayKey } from '../../../lib/dayKey';
import type { Task } from '../../../types/task';

/** Current persisted shape. Bump STORAGE_VERSION whenever it changes. */
export interface PersistedTasks {
  tasks: Task[];
}

export const STORAGE_VERSION = 2;

/** v1: tasks had no scheduledFor. */
type TaskV1 = Omit<Task, 'scheduledFor'>;

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

  // Defensive: drop malformed dates rather than letting them break filtering.
  return {
    tasks: (tasks as Task[]).map((task) =>
      task.scheduledFor === null || isDayKey(task.scheduledFor)
        ? task
        : { ...task, scheduledFor: null },
    ),
  };
}
