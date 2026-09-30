import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { TaskCategory, TaskSize } from '../../types/task';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Display metadata for task enums, shared by every task UI. */
export const SIZE_LABELS: Record<TaskSize, { short: string; full: string }> = {
  small: { short: 'S', full: 'Small' },
  medium: { short: 'M', full: 'Medium' },
  large: { short: 'L', full: 'Large' },
};

export const CATEGORY_OPTIONS: Record<TaskCategory, { label: string; icon: IconName }> = {
  home: { label: 'Home', icon: 'home-outline' },
  work: { label: 'Work', icon: 'briefcase-outline' },
  personal: { label: 'Personal', icon: 'person-outline' },
  uncategorized: { label: 'None', icon: 'ellipse-outline' },
};
