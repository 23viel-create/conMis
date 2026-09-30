import { useRef, useState, type ComponentProps, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  TASK_CATEGORIES,
  TASK_DEFAULTS,
  TASK_SIZES,
  type Task,
  type TaskCategory,
  type TaskSize,
} from '../../../types/task';
import { useTasksStore } from '../store/tasksSlice';

type IconName = ComponentProps<typeof Ionicons>['name'];

const SIZE_LABELS: Record<TaskSize, { short: string; full: string }> = {
  small: { short: 'S', full: 'Small' },
  medium: { short: 'M', full: 'Medium' },
  large: { short: 'L', full: 'Large' },
};

const CATEGORY_OPTIONS: Record<TaskCategory, { label: string; icon: IconName }> = {
  home: { label: 'Home', icon: 'home-outline' },
  work: { label: 'Work', icon: 'briefcase-outline' },
  personal: { label: 'Personal', icon: 'person-outline' },
  uncategorized: { label: 'None', icon: 'ellipse-outline' },
};

// Mirrors the Tailwind slate/indigo palette from the web draft.
const palette = {
  light: {
    card: '#ffffff',
    border: '#e2e8f0',
    field: '#f1f5f9',
    fieldFocused: '#ffffff',
    text: '#0f172a',
    textMuted: '#475569',
    placeholder: '#94a3b8',
    accent: '#4f46e5',
    accentText: '#4338ca',
    accentSoft: '#eef2ff',
    segmentActive: '#ffffff',
    onAccent: '#ffffff',
  },
  dark: {
    card: '#0f172a',
    border: '#334155',
    field: '#1e293b',
    fieldFocused: '#0f172a',
    text: '#f1f5f9',
    textMuted: '#cbd5e1',
    placeholder: '#64748b',
    accent: '#6366f1',
    accentText: '#c7d2fe',
    accentSoft: 'rgba(99, 102, 241, 0.15)',
    segmentActive: '#334155',
    onAccent: '#ffffff',
  },
};

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
  const colors = palette[useColorScheme() === 'dark' ? 'dark' : 'light'];

  const [title, setTitle] = useState('');
  const [size, setSize] = useState<TaskSize>(TASK_DEFAULTS.size);
  const [category, setCategory] = useState<TaskCategory>(TASK_DEFAULTS.category);
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<'title' | 'notes' | null>(null);

  const titleRef = useRef<ComponentRef<typeof TextInput>>(null);

  const canSubmit = title.trim().length > 0;

  function handleSubmit() {
    const task = addTask({ title, size, category, notes });
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
          accessibilityState={{ disabled: !canSubmit }}
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
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Size"
          style={[styles.segmented, { backgroundColor: colors.field }]}
        >
          {TASK_SIZES.map((value) => {
            const selected = size === value;
            return (
              <Pressable
                key={value}
                onPress={() => setSize(value)}
                accessibilityRole="radio"
                accessibilityLabel={SIZE_LABELS[value].full}
                accessibilityState={{ checked: selected }}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.segment,
                  selected && [styles.segmentSelected, { backgroundColor: colors.segmentActive }],
                  pressed && !selected && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: selected ? colors.accentText : colors.textMuted },
                  ]}
                >
                  {SIZE_LABELS[value].short}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Category */}
      <View accessibilityRole="radiogroup" accessibilityLabel="Category" style={styles.chips}>
        {TASK_CATEGORIES.map((value) => {
          const selected = category === value;
          const { label, icon } = CATEGORY_OPTIONS[value];
          const tint = selected ? colors.accentText : colors.textMuted;
          return (
            <Pressable
              key={value}
              onPress={() => setCategory(value)}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderColor: selected ? colors.accent : colors.border,
                  backgroundColor: selected ? colors.accentSoft : 'transparent',
                },
                pressed && !selected && styles.pressed,
              ]}
            >
              <Ionicons name={icon} size={16} color={tint} />
              <Text style={[styles.chipText, { color: tint }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Notes (collapsed by default) */}
      <Pressable
        onPress={toggleNotes}
        accessibilityRole="button"
        accessibilityLabel={notesToggleLabel}
        accessibilityState={{ expanded: notesOpen }}
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
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    gap: 2,
  },
  segment: {
    minWidth: 48,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  segmentSelected: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
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
