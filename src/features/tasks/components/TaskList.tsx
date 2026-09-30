import { memo, useMemo, type ReactElement } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { dayKeyToDate } from '../../../lib/dayKey';
import { isCompleted, type Task, type TaskId } from '../../../types/task';
import { useColors, type Colors } from '../../../theme/colors';
import type { TimelineView } from '../../calendar';
import { useVisibleTasks } from '../hooks/useVisibleTasks';
import { notePreviewText } from '../notes/noteMarkdown';
import { effectiveDay, previewNote } from '../selectors';
import { useTasksStore } from '../store/tasksSlice';
import { CATEGORY_OPTIONS, SIZE_LABELS } from '../taskMeta';

interface TaskListProps {
  /** Rendered above the tasks and scrolls with them (e.g. the quick-add form). */
  header?: ReactElement;
}

/** Shows the tasks for the view selected in TimelineNav. */
export function TaskList({ header }: TaskListProps) {
  const { tasks, view, today } = useVisibleTasks();
  const toggleComplete = useTasksStore((state) => state.toggleComplete);
  const colors = useColors();
  const { i18n } = useTranslation();

  // In the week view each row names its day ("Thu"); single-day views don't need it.
  const weekdayFormat = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }),
    [i18n.language],
  );

  return (
    <FlatList
      data={tasks}
      keyExtractor={(task) => task.id}
      renderItem={({ item }) => (
        <TaskRow
          task={item}
          colors={colors}
          onToggle={toggleComplete}
          dayLabel={
            view === 'week'
              ? weekdayFormat.format(dayKeyToDate(effectiveDay(item, today)))
              : undefined
          }
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState colors={colors} view={view} />}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}

interface TaskRowProps {
  task: Task;
  colors: Colors;
  onToggle: (id: TaskId) => void;
  /** Weekday shown in the meta row, e.g. in the week view. */
  dayLabel?: string;
}

// Memoized: toggling one task only re-renders that row, because the store
// keeps the identity of untouched task objects.
const TaskRow = memo(function TaskRow({ task, colors, onToggle, dayLabel }: TaskRowProps) {
  const done = isCompleted(task);
  const category = CATEGORY_OPTIONS[task.category];
  const note = previewNote(task);
  const notesPreview = note ? notePreviewText(note.content) : '';

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
        done && styles.rowDone,
      ]}
    >
      <Pressable
        onPress={() => onToggle(task.id)}
        accessibilityRole="checkbox"
        aria-checked={done}
        accessibilityLabel={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        hitSlop={8}
        style={({ pressed }) => [styles.checkbox, pressed && styles.pressed]}
      >
        <Ionicons
          name={done ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={done ? colors.accent : colors.placeholder}
        />
      </Pressable>

      <Pressable
        onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
        accessibilityRole="button"
        accessibilityHint="Opens the task to edit it and see its notes"
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <Text
          style={[
            styles.title,
            { color: colors.text },
            done && [styles.titleDone, { color: colors.textMuted }],
          ]}
        >
          {task.title}
        </Text>

        <View style={styles.meta}>
          {dayLabel !== undefined && (
            <Text style={[styles.dayLabel, { color: colors.accentText }]}>{dayLabel}</Text>
          )}
          <View
            style={[styles.sizeBadge, { backgroundColor: colors.field }]}
            accessibilityLabel={`Size: ${SIZE_LABELS[task.size].full}`}
          >
            <Text style={[styles.sizeText, { color: colors.textMuted }]}>
              {SIZE_LABELS[task.size].short}
            </Text>
          </View>
          <View style={styles.category} accessibilityLabel={`Category: ${category.label}`}>
            <Ionicons name={category.icon} size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{category.label}</Text>
          </View>
        </View>

        {notesPreview.length > 0 && (
          <View style={styles.notesRow}>
            {note?.isPinned && <Ionicons name="pin" size={13} color={colors.textMuted} />}
            <Text numberOfLines={2} style={[styles.notes, { color: colors.textMuted }]}>
              {notesPreview}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
});

function Separator() {
  return <View style={styles.separator} />;
}

function EmptyState({ colors, view }: { colors: Colors; view: TimelineView }) {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <Ionicons name="checkbox-outline" size={32} color={colors.placeholder} />
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        {t(`tasks.empty.${view}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowDone: {
    opacity: 0.55,
  },
  checkbox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sizeBadge: {
    minWidth: 24,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 13,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  notes: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: 10,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
