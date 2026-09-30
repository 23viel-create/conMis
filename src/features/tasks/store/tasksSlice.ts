import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isDayKey, toDayKey } from '../../../lib/dayKey';
import {
  TASK_DEFAULTS,
  type NewTaskInput,
  type Note,
  type NoteId,
  type NoteKind,
  type Task,
  type TaskId,
  type TaskPatch,
} from '../../../types/task';
import { toggleChecklistLine } from '../notes/noteMarkdown';
import { buildRescheduleNote, isPostponement } from '../rescheduling';
import { STORAGE_VERSION, migrateTasks, type PersistedTasks } from './migrations';

export interface UpdateTaskOptions {
  /** Why the task was postponed; recorded in the automatic reschedule note. */
  rescheduleReason?: string;
}

export interface TasksSlice {
  tasks: Task[];
  /**
   * Creates a task from user input. The store owns `id`, `createdAt` and
   * `completedAt`. Returns the created task, or `null` if the title is blank.
   */
  addTask: (input: NewTaskInput) => Task | null;
  /** Marks an open task complete (now), or reopens a completed one (null). */
  toggleComplete: (id: TaskId) => void;
  /**
   * Edits title, size, category or date. Moving `scheduledFor` later than
   * the task's current day appends a reschedule note (with the reason).
   * A blank title or malformed date in the patch is ignored.
   */
  updateTask: (id: TaskId, patch: TaskPatch, options?: UpdateTaskOptions) => void;
  /** Appends a note. Returns it, or `null` if the content is blank. */
  addNoteToTask: (taskId: TaskId, content: string, isPinned?: boolean) => Note | null;
  toggleNotePin: (taskId: TaskId, noteId: NoteId) => void;
  /** Checks or unchecks one '- [ ]' line inside a note. */
  toggleNoteChecklistItem: (taskId: TaskId, noteId: NoteId, lineIndex: number) => void;
  /** Removes a task and its whole notes log. */
  deleteTask: (id: TaskId) => void;
  /**
   * Replaces a user note's text. Blank content is ignored (delete instead).
   * Reschedule notes are a factual record and can't be edited.
   */
  editNote: (taskId: TaskId, noteId: NoteId, newContent: string) => void;
  deleteNote: (taskId: TaskId, noteId: NoteId) => void;
}

// On native, crypto.randomUUID is provided by src/lib/polyfills.ts (expo-crypto).
const generateId = (): string => crypto.randomUUID();

function createNote(content: string, kind: NoteKind = 'user', isPinned = false): Note {
  return { id: generateId(), content, createdAt: Date.now(), isPinned, kind };
}

/** Replaces one task; every other task keeps its identity (memoized rows skip re-render). */
function mapTask(tasks: Task[], id: TaskId, update: (task: Task) => Task): Task[] {
  return tasks.map((task) => (task.id === id ? update(task) : task));
}

function mapNote(task: Task, noteId: NoteId, update: (note: Note) => Note): Task {
  return { ...task, notes: task.notes.map((note) => (note.id === noteId ? update(note) : note)) };
}

export const createTasksSlice: StateCreator<TasksSlice, [['zustand/persist', unknown]]> = (
  set,
) => ({
  tasks: [],

  addTask: (input) => {
    const title = input.title.trim();
    if (!title) return null;

    const firstNote = input.notes?.trim();
    const task: Task = {
      id: generateId(),
      title,
      size: input.size ?? TASK_DEFAULTS.size,
      category: input.category ?? TASK_DEFAULTS.category,
      notes: firstNote ? [createNote(firstNote)] : [],
      createdAt: Date.now(),
      completedAt: null,
      scheduledFor: isDayKey(input.scheduledFor) ? input.scheduledFor : TASK_DEFAULTS.scheduledFor,
    };

    // Stored in creation order; display ordering is the job of selectors.
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  toggleComplete: (id) => {
    set((state) => ({
      tasks: mapTask(state.tasks, id, (task) => ({
        ...task,
        completedAt: task.completedAt === null ? Date.now() : null,
      })),
    }));
  },

  updateTask: (id, patch, options) => {
    set((state) => ({
      tasks: mapTask(state.tasks, id, (task) => {
        const next: Task = { ...task };

        const title = patch.title?.trim();
        if (title) next.title = title;
        if (patch.size) next.size = patch.size;
        if (patch.category) next.category = patch.category;

        if (patch.scheduledFor !== undefined) {
          const to = patch.scheduledFor;
          if (to === null || isDayKey(to)) {
            next.scheduledFor = to;
            const today = toDayKey();
            if (to !== task.scheduledFor && isPostponement(task.scheduledFor, to, today)) {
              const content = buildRescheduleNote(
                task.scheduledFor,
                options?.rescheduleReason ?? '',
                today,
              );
              next.notes = [...task.notes, createNote(content, 'reschedule')];
            }
          }
        }
        return next;
      }),
    }));
  },

  addNoteToTask: (taskId, content, isPinned = false) => {
    const text = content.trim();
    if (!text) return null;
    const note = createNote(text, 'user', isPinned);
    set((state) => ({
      tasks: mapTask(state.tasks, taskId, (task) => ({ ...task, notes: [...task.notes, note] })),
    }));
    return note;
  },

  toggleNotePin: (taskId, noteId) => {
    set((state) => ({
      tasks: mapTask(state.tasks, taskId, (task) =>
        mapNote(task, noteId, (note) => ({ ...note, isPinned: !note.isPinned })),
      ),
    }));
  },

  toggleNoteChecklistItem: (taskId, noteId, lineIndex) => {
    set((state) => ({
      tasks: mapTask(state.tasks, taskId, (task) =>
        mapNote(task, noteId, (note) => ({
          ...note,
          content: toggleChecklistLine(note.content, lineIndex),
        })),
      ),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
  },

  editNote: (taskId, noteId, newContent) => {
    const content = newContent.trim();
    if (!content) return;
    set((state) => ({
      tasks: mapTask(state.tasks, taskId, (task) =>
        mapNote(task, noteId, (note) => (note.kind === 'user' ? { ...note, content } : note)),
      ),
    }));
  },

  deleteNote: (taskId, noteId) => {
    set((state) => ({
      tasks: mapTask(state.tasks, taskId, (task) => ({
        ...task,
        notes: task.notes.filter((note) => note.id !== noteId),
      })),
    }));
  },
});

export const useTasksStore = create<TasksSlice>()(
  persist(createTasksSlice, {
    name: 'conmis.tasks',
    storage: createJSONStorage<PersistedTasks>(() => AsyncStorage),
    version: STORAGE_VERSION,
    // Only data is persisted; actions are recreated on every launch.
    partialize: (state) => ({ tasks: state.tasks }),
    // Upgrades older saves (see migrations.ts) so users never lose tasks.
    migrate: migrateTasks,
  }),
);

function subscribeToHydration(onChange: () => void): () => void {
  const unsubHydrate = useTasksStore.persist.onHydrate(onChange);
  const unsubFinish = useTasksStore.persist.onFinishHydration(onChange);
  return () => {
    unsubHydrate();
    unsubFinish();
  };
}

/**
 * True once saved tasks have been loaded from AsyncStorage. Screens should
 * wait for this: it avoids flashing the empty state on launch, and a task
 * added before hydration finishes would be overwritten by the loaded data.
 */
export function useTasksHydrated(): boolean {
  return useSyncExternalStore(subscribeToHydration, () => useTasksStore.persist.hasHydrated());
}
