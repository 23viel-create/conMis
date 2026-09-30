import type { Task } from '../../types/task';

/**
 * Newest first. Completion does not change position, so a task doesn't jump
 * away from under the user's finger when it's checked off.
 */
export function sortTasksForList(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => b.createdAt - a.createdAt);
}
