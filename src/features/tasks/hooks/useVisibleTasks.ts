import { useMemo } from 'react';
import { getViewDayRange, useCalendarStore, useTodayKey, type TimelineView } from '../../calendar';
import type { DayKey, Task } from '../../../types/task';
import { selectTasksInRange } from '../selectors';
import { useTasksStore } from '../store/tasksSlice';

interface VisibleTasks {
  tasks: Task[];
  view: TimelineView;
  today: DayKey;
}

/** Tasks for the timeline view selected in TimelineNav. */
export function useVisibleTasks(): VisibleTasks {
  const allTasks = useTasksStore((state) => state.tasks);
  const view = useCalendarStore((state) => state.activeView);
  const today = useTodayKey();

  const tasks = useMemo(
    () => selectTasksInRange(allTasks, getViewDayRange(view, today), today),
    [allTasks, view, today],
  );

  return { tasks, view, today };
}
