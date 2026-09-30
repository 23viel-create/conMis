import { useRef, useState, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  TASK_DEFAULTS,
  type Task,
  type TaskCategory,
  type TaskSize,
} from '../../../types/task';
import { useColors } from '../../../theme/colors';
import { defaultDayForView, useCalendarStore, useTodayKey } from '../../calendar';
import { useTasksStore } from '../store/tasksSlice';
import { CategoryPicker } from './CategoryPicker';
import { SizePicker } from './SizePicker';

interface TaskFormProps {
  /** Called after a task was created, e.g. to show a toast or scroll to it. */
  onAdded?: (task: Task) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Quick-add form. If it sits inside a ScrollView, give that ScrollView
 * `keyboardShouldPersistTaps="handled"` so chips respond while the keyboard is up.
 */
export function TaskForm({ onAdded, style }: TaskFormProps) {
  const addTask = useTasksStore((state) => state.addTask);
  // New tasks land on the day being viewed, so they appear right where they were added.
  const activeView = useCalendarStore((state) => state.activeView);
  const today = useTodayKey();
  const colors = useColors();

  const [title, setTitle] = useState('');
  const [size, setSize] = useState<TaskSize>(TASK_DEFAULTS.size);
  const [category, setCategory] = useState<TaskCategory>(TASK_DEFAULTS.category);
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<'title' | 'notes' | null>(null);

  const titleRef = useRef<ComponentRef<typeof TextInput>>(null);

  const canSubmit = title.trim().length > 0;

  function handleSubmit() {
    const task = addTask({
      title,
      size,
      category,
      notes,
      scheduledFor: defaultDayForView(activeView, today),
    });
    if (!task) return;

    // Size and category stay selected so batches of similar tasks are fast
    // to enter; title and notes reset for the next entry.
    setTitle('');
    setNotes('');
    if (notesOpen) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setNotesOpen(false);
    }
    titleRef.current?.focus();
    AccessibilityInfo.announceForAccessibility(`Added ${task.title}`);
    onAdded?.(task);
  }

  function toggleNotes() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotesOpen((open) => !open);
  }

  const notesToggleLabel = notesOpen ? 'Hide notes' : notes.trim() ? 'Notes (edited)' : 'Add notes';

  return (
    <View
      accessibilityLabel="Quick add task"
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
    >
      {/* Title */}
      <View style={styles.titleRow}>
        <TextInput
          ref={titleRef}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleSubmit}
          onFocus={() => setFocusedField('title')}
          onBlur={() => setFocusedField(null)}
          placeholder="What needs doing?"
          placeholderTextColor={colors.placeholder}
          accessibilityLabel="Task title"
          returnKeyType="done"
          submitBehavior="submit" // keep the keyboard up for rapid entry
          autoCapitalize="sentences"
          maxLength={200}
          style={[
            styles.field,
            styles.titleInput,
            {
              color: colors.text,
              backgroundColor: focusedField === 'title' ? colors.fieldFocused : colors.field,
              borderColor: focusedField === 'title' ? colors.accent : 'transparent',
            },
          ]}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Add task"
          aria-disabled={!canSubmit}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.accent, opacity: !canSubmit ? 0.4 : pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[styles.addButtonText, { color: colors.onAccent }]}>Add</Text>
        </Pressable>
      </View>

      {/* Size */}
      <View style={styles.sizeRow}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]} importantForAccessibility="no">
          SIZE
        </Text>
        <SizePicker value={size} onChange={setSize} />
      </View>

      {/* Category */}
      <CategoryPicker value={category} onChange={setCategory} />

      {/* Notes (collapsed by default) */}
      <Pressable
        onPress={toggleNotes}
        accessibilityRole="button"
        accessibilityLabel={notesToggleLabel}
        aria-expanded={notesOpen}
        hitSlop={8}
        style={({ pressed }) => [styles.notesToggle, pressed && styles.pressed]}
      >
        <Ionicons
          name={notesOpen ? 'chevron-down' : 'chevron-forward'}
          size={16}
          color={colors.textMuted}
        />
        <Text style={[styles.notesToggleText, { color: colors.textMuted }]}>{notesToggleLabel}</Text>
      </Pressable>

      {notesOpen && (
        <TextInput
          value={notes}
          onChangeText={setNotes}
          onFocus={() => setFocusedField('notes')}
          onBlur={() => setFocusedField(null)}
          autoFocus
          multiline
          textAlignVertical="top"
          placeholder="Plan it out…"
          placeholderTextColor={colors.placeholder}
          accessibilityLabel="Notes"
          style={[
            styles.field,
            styles.notesInput,
            {
              color: colors.text,
              backgroundColor: focusedField === 'notes' ? colors.fieldFocused : colors.field,
              borderColor: focusedField === 'notes' ? colors.accent : colors.border,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  field: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  titleInput: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
  },
  addButton: {
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
  },
  notesToggleText: {
    fontSize: 14,
  },
  notesInput: {
    minHeight: 96,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.6,
  },
});
