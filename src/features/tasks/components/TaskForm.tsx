import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import {
  TASK_CATEGORIES,
  TASK_DEFAULTS,
  TASK_SIZES,
  type Task,
  type TaskCategory,
  type TaskSize,
} from '../../../types/task';
import { useTasksStore } from '../store/tasksSlice';

const SIZE_LABELS: Record<TaskSize, { short: string; full: string }> = {
  small: { short: 'S', full: 'Small' },
  medium: { short: 'M', full: 'Medium' },
  large: { short: 'L', full: 'Large' },
};

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  home: 'Home',
  work: 'Work',
  personal: 'Personal',
  uncategorized: 'None',
};

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-4 w-4 shrink-0',
  'aria-hidden': true,
} as const;

const CATEGORY_ICONS: Record<TaskCategory, ReactNode> = {
  home: (
    <svg {...iconProps}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  work: (
    <svg {...iconProps}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  personal: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  uncategorized: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
    </svg>
  ),
};

// Radio inputs are visually hidden; the sibling label is the visible control.
// Native radios give us arrow-key navigation and form semantics for free.
const radioInputClass = 'peer sr-only';
const focusRingClass =
  'peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-slate-900';

interface TaskFormProps {
  /** Called after a task was created, e.g. to show a toast or scroll to it. */
  onAdded?: (task: Task) => void;
  className?: string;
}

export function TaskForm({ onAdded, className = '' }: TaskFormProps) {
  const addTask = useTasksStore((state) => state.addTask);

  const [title, setTitle] = useState('');
  const [size, setSize] = useState<TaskSize>(TASK_DEFAULTS.size);
  const [category, setCategory] = useState<TaskCategory>(TASK_DEFAULTS.category);
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  const canSubmit = title.trim().length > 0;

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    const task = addTask({ title, size, category, notes });
    if (!task) return;

    // Size and category stay selected so batches of similar tasks are fast
    // to enter; title and notes reset for the next entry.
    setTitle('');
    setNotes('');
    setNotesOpen(false);
    setAnnouncement(`Added “${task.title}”`);
    titleRef.current?.focus();
    onAdded?.(task);
  }

  function toggleNotes() {
    const next = !notesOpen;
    setNotesOpen(next);
    if (next) requestAnimationFrame(() => notesRef.current?.focus());
  }

  function handleNotesKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter makes new lines in notes; Cmd/Ctrl+Enter submits.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Quick add task"
      className={`w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5 ${className}`}
    >
      {/* Title */}
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-title`} className="sr-only">
          Task title
        </label>
        <input
          ref={titleRef}
          id={`${id}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-transparent bg-slate-100 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-slate-900"
        >
          Add
        </button>
      </div>

      {/* Size + category */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Size</legend>
          <span aria-hidden="true" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Size
          </span>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {TASK_SIZES.map((value) => (
              <div key={value}>
                <input
                  type="radio"
                  id={`${id}-size-${value}`}
                  name={`${id}-size`}
                  value={value}
                  checked={size === value}
                  onChange={() => setSize(value)}
                  className={radioInputClass}
                />
                <label
                  htmlFor={`${id}-size-${value}`}
                  title={SIZE_LABELS[value].full}
                  className={`flex h-9 min-w-10 cursor-pointer select-none items-center justify-center rounded-md px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900 peer-checked:bg-white peer-checked:text-indigo-700 peer-checked:shadow-sm dark:text-slate-300 dark:hover:text-white dark:peer-checked:bg-slate-700 dark:peer-checked:text-indigo-300 ${focusRingClass}`}
                >
                  <span aria-hidden="true">{SIZE_LABELS[value].short}</span>
                  <span className="sr-only">{SIZE_LABELS[value].full}</span>
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="sr-only">Category</legend>
          <div className="flex flex-wrap gap-1.5">
            {TASK_CATEGORIES.map((value) => (
              <div key={value}>
                <input
                  type="radio"
                  id={`${id}-category-${value}`}
                  name={`${id}-category`}
                  value={value}
                  checked={category === value}
                  onChange={() => setCategory(value)}
                  className={radioInputClass}
                />
                <label
                  htmlFor={`${id}-category-${value}`}
                  className={`flex h-9 cursor-pointer select-none items-center gap-1.5 rounded-full border border-slate-200 px-3 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white dark:peer-checked:border-indigo-400 dark:peer-checked:bg-indigo-500/15 dark:peer-checked:text-indigo-200 ${focusRingClass}`}
                >
                  {CATEGORY_ICONS[value]}
                  {CATEGORY_LABELS[value]}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Notes (collapsed by default) */}
      <div className="mt-3">
        <button
          type="button"
          onClick={toggleNotes}
          aria-expanded={notesOpen}
          aria-controls={`${id}-notes-panel`}
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`h-4 w-4 transition-transform ${notesOpen ? 'rotate-90' : ''}`}
          >
            <path d="M7.5 5l5 5-5 5V5z" />
          </svg>
          {notesOpen ? 'Hide notes' : notes.trim() ? 'Notes (edited)' : 'Add notes'}
        </button>

        <div id={`${id}-notes-panel`} hidden={!notesOpen} className="mt-2">
          <label htmlFor={`${id}-notes`} className="sr-only">
            Notes
          </label>
          <textarea
            ref={notesRef}
            id={`${id}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleNotesKeyDown}
            rows={3}
            placeholder="Plan it out… (⌘/Ctrl + Enter to add)"
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
          />
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </form>
  );
}
