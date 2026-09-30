import { useMemo } from 'react';
import { useTodayKey } from '../../calendar';
import type { Task } from '../../../types/task';
import { selectRolloverTasks } from '../selectors';
import { useTasksStore } from '../store/tasksSlice';

/** Overdue open tasks, recomputed when tasks change or the day rolls over. */
export function useRolloverTasks(): Task[] {
  const tasks = useTasksStore((state) => state.tasks);
  const today = useTodayKey();
  return useMemo(() => selectRolloverTasks(tasks, today), [tasks, today]);
}
