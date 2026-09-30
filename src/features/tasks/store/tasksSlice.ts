import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isDayKey } from '../../../lib/dayKey';
import { TASK_DEFAULTS, type NewTaskInput, type Task, type TaskId } from '../../../types/task';
import { STORAGE_VERSION, migrateTasks, type PersistedTasks } from './migrations';

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
      scheduledFor: isDayKey(input.scheduledFor) ? input.scheduledFor : TASK_DEFAULTS.scheduledFor,
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
