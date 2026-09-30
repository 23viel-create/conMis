import { create, type StateCreator } from 'zustand';
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

// On native, crypto.randomUUID is provided by src/lib/polyfills.ts (expo-crypto).
const generateId = (): string => crypto.randomUUID();

/**
 * Slice creator, kept separate from the hook so it can be composed into the
 * root store (`src/store/index.ts`) once the filters slice and persistence
 * are added.
 */
export const createTasksSlice: StateCreator<TasksSlice> = (set) => ({
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

export const useTasksStore = create<TasksSlice>()(createTasksSlice);
