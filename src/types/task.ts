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

/**
 * A local calendar day as 'YYYY-MM-DD'. Deliberately not a timestamp: a task
 * planned for "Thursday" stays on Thursday even if the device changes time
 * zone. Keys sort and compare correctly as plain strings.
 */
export type DayKey = string;

/** Unique task identifier (generated with crypto.randomUUID()). */
export type TaskId = string;

/** Unique note identifier. */
export type NoteId = string;

/** Kinds a user can pick when writing a note. 'comment' is the default. */
export const USER_NOTE_KINDS = ['comment', 'detail', 'attention', 'thought'] as const;
export type UserNoteKind = (typeof USER_NOTE_KINDS)[number];

/**
 * User notes carry the kind the user picked; 'reschedule' notes are appended
 * by the app when a task is postponed. The kind lets reflection features
 * count postponements without parsing (localized) note text.
 */
export type NoteKind = UserNoteKind | 'reschedule';

export const isUserNote = (note: Note): boolean => note.kind !== 'reschedule';

export interface Note {
  id: NoteId;
  /** Plain text with light markdown: '- [ ]' / '- [x]' checklists, '- ' bullets, '# ' headings, **bold**. */
  content: string;
  createdAt: Timestamp;
  isPinned: boolean;
  kind: NoteKind;
}

export interface Task {
  id: TaskId;
  title: string;
  size: TaskSize;
  category: TaskCategory;
  /** Notes log for planning and reflection. Display order is decided by selectors. */
  notes: Note[];
  createdAt: Timestamp;
  /** null while open; set when completed. Cleared again if the task is reopened. */
  completedAt: Timestamp | null;
  /** Day the task is planned for now; null = unscheduled (shown on Today). */
  scheduledFor: DayKey | null;
  /**
   * The first day the task was committed to: the intention. Set at creation
   * (or when an unscheduled task first gets a day) and never moved by
   * rescheduling, so reflection can count missed intentions honestly.
   */
  originalScheduledFor: DayKey | null;
}

/** Input for creating a task: the store owns id, timestamps and note objects. */
export type NewTaskInput = Pick<Task, 'title'> &
  Partial<Pick<Task, 'size' | 'category' | 'scheduledFor'>> & {
    /** Optional first note, e.g. from the quick-add form. Blank text adds no note. */
    notes?: string;
  };

/**
 * Fields a user may edit after creation. Notes are deliberately excluded:
 * they change only through the note actions, so the log can't be overwritten.
 */
export type TaskPatch = Partial<Pick<Task, 'title' | 'size' | 'category' | 'scheduledFor'>>;

export const TASK_DEFAULTS = {
  size: 'medium',
  category: 'uncategorized',
  scheduledFor: null,
} as const satisfies Pick<Task, 'size' | 'category' | 'scheduledFor'>;

/** Derived, never stored: completion state is computed from completedAt. */
export const isCompleted = (task: Task): boolean => task.completedAt !== null;
