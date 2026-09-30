/**
 * Core domain model for tasks.
 *
 * Enumerations are declared as `as const` arrays so they can be iterated in
 * the UI (filter chips, dropdowns) while still producing narrow union types.
 */

export const TASK_SIZES = ['small', 'medium', 'large'] as const;
export type TaskSize = (typeof TASK_SIZES)[number];

export const TASK_CATEGORIES = ['home', 'work', 'personal', 'uncategorized'] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

/** Milliseconds since the Unix epoch (Date.now()). JSON-safe and cheap to sort/compare. */
export type Timestamp = number;

/** Unique task identifier (generated with crypto.randomUUID()). */
export type TaskId = string;

export interface Task {
  id: TaskId;
  title: string;
  size: TaskSize;
  category: TaskCategory;
  /** Free-form planning notes. Empty string when unused, never undefined. */
  notes: string;
  createdAt: Timestamp;
  /** null while open; set when completed. Cleared again if the task is reopened. */
  completedAt: Timestamp | null;
}

/** Input for creating a task: the store owns id and timestamps. */
export type NewTaskInput = Pick<Task, 'title'> &
  Partial<Pick<Task, 'size' | 'category' | 'notes'>>;

/** Fields a user may edit after creation. */
export type TaskPatch = Partial<Pick<Task, 'title' | 'size' | 'category' | 'notes'>>;

export const TASK_DEFAULTS = {
  size: 'medium',
  category: 'uncategorized',
  notes: '',
} as const satisfies Pick<Task, 'size' | 'category' | 'notes'>;

/** Derived, never stored: completion state is computed from completedAt. */
export const isCompleted = (task: Task): boolean => task.completedAt !== null;
