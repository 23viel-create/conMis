import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { TASK_DEFAULTS, type NewTaskInput, type Task, type TaskId } from '../../../types/task';

export interface TasksSlice {
  tasks: Task[];
  /**
   * Creates a task from user input. The store owns `id`, `createdAt` and
   * `completedAt`. Returns the created task, or `null` if the title is blank.
   */
  addTask: (input: NewTaskInput) => Task | null;
  /** Marks an open task complete (now), or reopens a completed one (null). */
  toggleComplete: (id: TaskId) => void;
}

/** Only data is persisted; actions are recreated on every launch. */
type PersistedTasks = Pick<TasksSlice, 'tasks'>;

// On native, crypto.randomUUID is provided by src/lib/polyfills.ts (expo-crypto).
const generateId = (): string => crypto.randomUUID();

export const createTasksSlice: StateCreator<TasksSlice, [['zustand/persist', unknown]]> = (
  set,
) => ({
  tasks: [],

  addTask: (input) => {
    const title = input.title.trim();
    if (!title) return null;

    const task: Task = {
      id: generateId(),
      title,
      size: input.size ?? TASK_DEFAULTS.size,
      category: input.category ?? TASK_DEFAULTS.category,
      notes: input.notes?.trim() ?? TASK_DEFAULTS.notes,
      createdAt: Date.now(),
      completedAt: null,
    };

    // Stored in creation order; display ordering is the job of selectors.
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  toggleComplete: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, completedAt: task.completedAt === null ? Date.now() : null }
          : task,
      ),
    }));
  },
});

/**
 * Bump when the persisted shape of `Task` changes, and teach `migrate` how to
 * upgrade older snapshots, so existing users never lose their tasks.
 */
const STORAGE_VERSION = 1;

export const useTasksStore = create<TasksSlice>()(
  persist(createTasksSlice, {
    name: 'conmis.tasks',
    storage: createJSONStorage<PersistedTasks>(() => AsyncStorage),
    version: STORAGE_VERSION,
    partialize: (state) => ({ tasks: state.tasks }),
    migrate: (persisted, fromVersion) => {
      // No older versions exist yet. Future: `if (fromVersion < 2) { ... }`.
      void fromVersion;
      return persisted as PersistedTasks;
    },
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
