import { useMemo, type ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TaskCategory, TaskSize } from '../../types/task';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const CATEGORY_ICONS: Record<TaskCategory, IconName> = {
  home: 'home-outline',
  work: 'briefcase-outline',
  personal: 'person-outline',
  uncategorized: 'ellipse-outline',
};

/** Translated display labels for task enums, shared by every task UI. */
export function useTaskLabels() {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      size: (size: TaskSize) => ({ short: t(`size.short.${size}`), full: t(`size.full.${size}`) }),
      category: (category: TaskCategory) => t(`category.${category}`),
    }),
    [t],
  );
}
