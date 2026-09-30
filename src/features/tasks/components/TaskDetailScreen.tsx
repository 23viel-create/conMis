import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  FlatList,
  I18nManager,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { addDaysToKey } from '../../../lib/dayKey';
import { formatDay, formatHebrewDay } from '../../../lib/dateFormat';
import type { DayKey, Note, NoteId, Task, TaskId } from '../../../types/task';
import { useColors, type Colors } from '../../../theme/colors';
import { useTodayKey } from '../../calendar';
import { isPostponement } from '../rescheduling';
import { sortNotes, type NoteOrder } from '../selectors';
import { useTasksStore } from '../store/tasksSlice';
import { CategoryPicker } from './CategoryPicker';
import { NoteContent } from './NoteContent';
import { SizePicker } from './SizePicker';

interface TaskDetailScreenProps {
  taskId: TaskId;
}

/**
 * Full-screen task view. Layout, top to bottom:
 *   header (back)
 *   one scrolling list: task editor (title, size, category, date) + notes
 *   note composer, pinned to the bottom and lifted above the keyboard
 * The editor scrolls away with the notes instead of taking a fixed half of
 * the screen, so there's room to read notes while the keyboard is open.
 */
export function TaskDetailScreen({ taskId }: TaskDetailScreenProps) {
  const task = useTasksStore((state) => state.tasks.find((t) => t.id === taskId));
  const toggleNotePin = useTasksStore((state) => state.toggleNotePin);
  const toggleChecklistItem = useTasksStore((state) => state.toggleNoteChecklistItem);
  const deleteNote = useTasksStore((state) => state.deleteNote);
  const colors = useColors();
  const { t } = useTranslation();

  const [order, setOrder] = useState<NoteOrder>('newest');
  // Long-press menu target, and the note loaded into the composer for editing.
  const [menuNote, setMenuNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const openNoteMenu = useCallback((note: Note) => setMenuNote(note), []);
  const listRef = useRef<FlatList<Note>>(null);

  const notes = useMemo(() => sortNotes(task?.notes ?? [], order), [task?.notes, order]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function revealNewNote() {
    // Newest-first: new notes sit right after the pinned ones; oldest-first: at the end.
    requestAnimationFrame(() => {
      if (order === 'oldest') {
        listRef.current?.scrollToEnd({ animated: true });
      } else {
        const index = notes.filter((note) => note.isPinned).length;
        listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 });
      }
    });
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <Header title={t('taskDetail.heading')} onBack={goBack} colors={colors} />

      {!task ? (
        <Text style={[styles.notFound, { color: colors.textMuted }]}>
          {t('taskDetail.notFound')}
        </Text>
      ) : (
        // 'padding' on both platforms: with Android edge-to-edge the window no
        // longer resizes for the keyboard, so we have to make room ourselves.
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <FlatList
            ref={listRef}
            data={notes}
            keyExtractor={(note) => note.id}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                taskId={task.id}
                colors={colors}
                onTogglePin={toggleNotePin}
                onToggleItem={toggleChecklistItem}
                // Reschedule notes are a factual record: no edit/delete menu.
                onLongPress={item.kind === 'user' ? openNoteMenu : undefined}
                isEditing={item.id === editingNote?.id}
              />
            )}
            ListHeaderComponent={
              <>
                <TaskEditor task={task} colors={colors} />
                <NotesHeader
                  count={notes.length}
                  order={order}
                  onChangeOrder={setOrder}
                  colors={colors}
                />
              </>
            }
            ListEmptyComponent={
              <Text style={[styles.emptyNotes, { color: colors.textMuted }]}>
                {t('notes.empty')}
              </Text>
            }
            ItemSeparatorComponent={NoteSeparator}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onScrollToIndexFailed={() => listRef.current?.scrollToEnd({ animated: true })}
          />
          <NoteComposer
            taskId={task.id}
            colors={colors}
            onAdded={revealNewNote}
            editing={editingNote}
            onEditDone={() => setEditingNote(null)}
          />
          <ActionSheet
            visible={menuNote !== null}
            cancelLabel={t('actions.cancel')}
            onClose={() => setMenuNote(null)}
            actions={
              menuNote
                ? [
                    {
                      label: t('noteActions.edit'),
                      icon: 'create-outline',
                      onPress: () => setEditingNote(menuNote),
                    },
                    {
                      label: t('noteActions.delete'),
                      icon: 'trash-outline',
                      destructive: true,
                      onPress: () => {
                        if (editingNote?.id === menuNote.id) setEditingNote(null);
                        deleteNote(task.id, menuNote.id);
                      },
                    },
                  ]
                : []
            }
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ Header */

function Header({ title, onBack, colors }: { title: string; onBack: () => void; colors: Colors }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('taskDetail.back')}
        hitSlop={10}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        {/* Icons don't mirror automatically: "back" points right in RTL. */}
        <Ionicons
          name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
          size={26}
          color={colors.accent}
        />
      </Pressable>
      <Text style={[styles.headerTitle, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.iconButton} />
    </View>
  );
}

/* -------------------------------------------------------------- TaskEditor */

function TaskEditor({ task, colors }: { task: Task; colors: Colors }) {
  const updateTask = useTasksStore((state) => state.updateTask);
  const { t } = useTranslation();

  // Title is edited locally and saved on blur/submit, not per keystroke,
  // so persistence doesn't write to storage on every character.
  const [title, setTitle] = useState(task.title);
  useEffect(() => setTitle(task.title), [task.title]);

  function commitTitle() {
    if (title.trim() && title.trim() !== task.title) updateTask(task.id, { title });
    else setTitle(task.title); // blank or unchanged: restore
  }

  return (
    <View style={styles.editor}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        onEndEditing={commitTitle}
        onSubmitEditing={commitTitle}
        accessibilityLabel={t('taskDetail.titleLabel')}
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        maxLength={200}
        multiline={false}
        style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
      />

      <Section label={t('taskDetail.size')} colors={colors}>
        <View style={styles.rowStart}>
          <SizePicker
            value={task.size}
            onChange={(size) => updateTask(task.id, { size })}
            accessibilityLabel={t('taskDetail.size')}
          />
        </View>
      </Section>

      <Section label={t('taskDetail.category')} colors={colors}>
        <CategoryPicker
          value={task.category}
          onChange={(category) => updateTask(task.id, { category })}
          accessibilityLabel={t('taskDetail.category')}
        />
      </Section>

      <Section label={t('taskDetail.date')} colors={colors}>
        <DateEditor task={task} colors={colors} />
      </Section>
    </View>
  );
}

function Section({
  label,
  colors,
  children,
}: {
  label: string;
  colors: Colors;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

/* -------------------------------------------------------------- DateEditor */

/**
 * Picks a new day with a stepper and quick chips. The change is staged and
 * confirmed explicitly, so postponing can ask "why?" (recorded in a note).
 */
function DateEditor({ task, colors }: { task: Task; colors: Colors }) {
  const updateTask = useTasksStore((state) => state.updateTask);
  const today = useTodayKey();
  const { t, i18n } = useTranslation();

  const [pending, setPending] = useState<DayKey | null>(null);
  const [reason, setReason] = useState('');

  const current = task.scheduledFor;
  const shown = pending ?? current ?? today;
  const postponing = pending !== null && isPostponement(current, pending, today);

  function stage(day: DayKey) {
    // Choosing the task's own day again cancels the change.
    setPending(day === current ? null : day);
  }

  function cancel() {
    setPending(null);
    setReason('');
  }

  function confirm() {
    if (pending === null) return;
    updateTask(task.id, { scheduledFor: pending }, { rescheduleReason: reason });
    cancel();
    Keyboard.dismiss();
  }

  const hebrew = formatHebrewDay(shown, i18n.language);
  const quickDays: { label: string; day: DayKey }[] = [
    { label: t('taskDetail.today'), day: today },
    { label: t('taskDetail.tomorrow'), day: addDaysToKey(today, 1) },
    { label: t('taskDetail.nextWeek'), day: addDaysToKey(today, 7) },
  ];

  return (
    <View style={styles.dateEditor}>
      <View style={[styles.dateCard, { backgroundColor: colors.field }]}>
        <StepButton
          icon={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
          label={t('taskDetail.previousDay')}
          onPress={() => stage(addDaysToKey(shown, -1))}
          colors={colors}
        />
        <View style={styles.dateText}>
          {pending !== null && (
            <Text style={[styles.dateWas, { color: colors.textMuted }]} numberOfLines={1}>
              {current ? formatDay(current, i18n.language) : t('taskDetail.unscheduled')}
            </Text>
          )}
          <Text
            style={[styles.dateMain, { color: pending ? colors.accentText : colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {current === null && pending === null
              ? t('taskDetail.unscheduled')
              : formatDay(shown, i18n.language)}
          </Text>
          {hebrew && (current !== null || pending !== null) && (
            <Text style={[styles.dateHebrew, { color: colors.textMuted }]}>{hebrew}</Text>
          )}
        </View>
        <StepButton
          icon={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
          label={t('taskDetail.nextDay')}
          onPress={() => stage(addDaysToKey(shown, 1))}
          colors={colors}
        />
      </View>

      <View style={styles.quickRow}>
        {quickDays.map(({ label, day }) => {
          const selected = day === shown && (pending !== null || current !== null);
          return (
            <Pressable
              key={label}
              onPress={() => stage(day)}
              accessibilityRole="button"
              aria-selected={selected}
              style={({ pressed }) => [
                styles.quickChip,
                {
                  borderColor: selected ? colors.accent : colors.border,
                  backgroundColor: selected ? colors.accentSoft : 'transparent',
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={{ color: selected ? colors.accentText : colors.textMuted }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {pending !== null && (
        <View style={styles.confirmBox}>
          {postponing && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                {t('taskDetail.reasonLabel')}
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={t('taskDetail.reasonPlaceholder')}
                placeholderTextColor={colors.placeholder}
                accessibilityLabel={t('taskDetail.reasonLabel')}
                returnKeyType="done"
                onSubmitEditing={confirm}
                style={[
                  styles.reasonInput,
                  { color: colors.text, backgroundColor: colors.field, borderColor: colors.border },
                ]}
              />
            </>
          )}
          <View style={styles.confirmRow}>
            <Pressable
              onPress={cancel}
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={{ color: colors.textMuted, fontWeight: '600' }}>
                {t('taskDetail.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.accent },
                pressed && styles.pressed,
              ]}
            >
              <Text style={{ color: colors.onAccent, fontWeight: '600' }}>
                {postponing ? t('taskDetail.confirmReschedule') : t('taskDetail.confirmMove')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function StepButton({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: 'chevron-back' | 'chevron-forward';
  label: string;
  onPress: () => void;
  colors: Colors;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={colors.accent} />
    </Pressable>
  );
}

/* ------------------------------------------------------------- Notes list */

function NotesHeader({
  count,
  order,
  onChangeOrder,
  colors,
}: {
  count: number;
  order: NoteOrder;
  onChangeOrder: (order: NoteOrder) => void;
  colors: Colors;
}) {
  const { t } = useTranslation();
  const orders: NoteOrder[] = ['newest', 'oldest'];
  return (
    <View style={styles.notesHeader}>
      <Text style={[styles.notesTitle, { color: colors.text }]} accessibilityRole="header">
        {t('notes.title')}
        {count > 0 && <Text style={{ color: colors.textMuted }}>{`  ${count}`}</Text>}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('notes.sortLabel')}
        style={[styles.orderToggle, { backgroundColor: colors.field }]}
      >
        {orders.map((value) => {
          const selected = value === order;
          return (
            <Pressable
              key={value}
              onPress={() => onChangeOrder(value)}
              accessibilityRole="radio"
              aria-checked={selected}
              style={[styles.orderOption, selected && { backgroundColor: colors.segmentActive }]}
            >
              <Text
                style={[
                  styles.orderText,
                  { color: selected ? colors.accentText : colors.textMuted },
                ]}
              >
                {t(`notes.${value}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface NoteCardProps {
  note: Note;
  taskId: TaskId;
  colors: Colors;
  onTogglePin: (taskId: TaskId, noteId: NoteId) => void;
  onToggleItem: (taskId: TaskId, noteId: NoteId, lineIndex: number) => void;
  /** Omitted for notes that can't be edited or deleted. */
  onLongPress?: (note: Note) => void;
  isEditing: boolean;
}

const NoteCard = memo(function NoteCard({
  note,
  taskId,
  colors,
  onTogglePin,
  onToggleItem,
  onLongPress,
  isEditing,
}: NoteCardProps) {
  const { t, i18n } = useTranslation();
  const isSystem = note.kind === 'reschedule';
  const timestamp = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(note.createdAt),
    [note.createdAt, i18n.language],
  );

  return (
    <Pressable
      onLongPress={onLongPress ? () => onLongPress(note) : undefined}
      disabled={!onLongPress}
      accessibilityHint={onLongPress ? t('actions.longPressHint') : undefined}
      accessibilityActions={onLongPress ? [{ name: 'longpress' }] : undefined}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'longpress') onLongPress?.(note);
      }}
      style={({ pressed }) => [
        styles.noteCard,
        {
          backgroundColor: isSystem ? colors.field : colors.card,
          borderColor: isEditing || note.isPinned ? colors.accent : colors.border,
        },
        isEditing && styles.noteCardEditing,
        pressed && styles.pressed,
      ]}
    >
      {isSystem && (
        <View style={styles.noteTag}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.noteTagText, { color: colors.textMuted }]}>
            {t('notes.rescheduledTag')}
          </Text>
        </View>
      )}

      <NoteContent
        content={note.content}
        colors={colors}
        onToggleItem={(line) => onToggleItem(taskId, note.id, line)}
      />

      <View style={styles.noteFooter}>
        <Text style={[styles.noteTime, { color: colors.textMuted }]}>
          {note.isPinned ? `${t('notes.pinned')} · ${timestamp}` : timestamp}
        </Text>
        <Pressable
          onPress={() => onTogglePin(taskId, note.id)}
          accessibilityRole="button"
          accessibilityLabel={note.isPinned ? t('notes.unpin') : t('notes.pin')}
          aria-pressed={note.isPinned}
          hitSlop={10}
          style={({ pressed }) => [styles.iconButtonSmall, pressed && styles.pressed]}
        >
          <Ionicons
            name={note.isPinned ? 'pin' : 'pin-outline'}
            size={18}
            color={note.isPinned ? colors.accent : colors.textMuted}
          />
        </Pressable>
      </View>
    </Pressable>
  );
});

function NoteSeparator() {
  return <View style={styles.noteSeparator} />;
}

/* ----------------------------------------------------------- NoteComposer */

/**
 * Bottom input for new notes. In edit mode (a note chosen from the long-press
 * menu) it loads that note's text and saves over it; any unsent new-note
 * draft is set aside and restored afterwards.
 */
function NoteComposer({
  taskId,
  colors,
  onAdded,
  editing,
  onEditDone,
}: {
  taskId: TaskId;
  colors: Colors;
  onAdded: () => void;
  editing: Note | null;
  onEditDone: () => void;
}) {
  const addNoteToTask = useTasksStore((state) => state.addNoteToTask);
  const editNote = useTasksStore((state) => state.editNote);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [draft, setDraft] = useState('');
  const setAsideDraft = useRef('');

  const editingId = editing?.id;
  useEffect(() => {
    if (!editing) return;
    setAsideDraft.current = draft;
    setDraft(editing.content);
    inputRef.current?.focus();
    // Runs only when a different note enters edit mode, reading that render's draft.
  }, [editingId]);

  const canSend = draft.trim().length > 0;

  function finishEditing() {
    setDraft(setAsideDraft.current);
    setAsideDraft.current = '';
    onEditDone();
  }

  function send() {
    if (editing) {
      editNote(taskId, editing.id, draft);
      finishEditing();
      return;
    }
    if (!addNoteToTask(taskId, draft)) return;
    setDraft('');
    onAdded();
  }

  return (
    <View
      style={[
        styles.composer,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          // Clear the home indicator, except when the keyboard already covers it.
          paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 8),
        },
      ]}
    >
      {editing && (
        <View style={styles.editingBanner}>
          <Ionicons name="create-outline" size={16} color={colors.accentText} />
          <Text style={[styles.editingText, { color: colors.accentText }]}>
            {t('noteActions.editing')}
          </Text>
          <Pressable
            onPress={finishEditing}
            accessibilityRole="button"
            accessibilityLabel={t('noteActions.cancelEdit')}
            hitSlop={10}
            style={({ pressed }) => [styles.iconButtonSmall, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      )}
      <View style={styles.composerRow}>
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('notes.placeholder')}
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={editing ? t('noteActions.editing') : t('notes.add')}
          multiline
          textAlignVertical="top"
          style={[
            styles.composerInput,
            { color: colors.text, backgroundColor: colors.field, borderColor: colors.border },
          ]}
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={editing ? t('noteActions.save') : t('notes.add')}
          aria-disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            { backgroundColor: colors.accent, opacity: !canSend ? 0.4 : pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name={editing ? 'checkmark' : 'arrow-up'} size={22} color={colors.onAccent} />
        </Pressable>
      </View>
    </View>
  );
}

function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // iOS has "will" events (in sync with the animation); Android only "did".
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/* ----------------------------------------------------------------- Styles */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconButtonSmall: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  notFound: { padding: 24, fontSize: 16, textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 24 },

  editor: { gap: 18, marginBottom: 24 },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  section: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  rowStart: { flexDirection: 'row' },

  dateEditor: { gap: 10 },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  stepButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateText: { flex: 1, alignItems: 'center', gap: 2 },
  dateWas: { fontSize: 12, textDecorationLine: 'line-through' },
  dateMain: { fontSize: 17, fontWeight: '600' },
  dateHebrew: { fontSize: 13 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBox: { gap: 8 },
  reasonInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  confirmRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  secondaryButton: { height: 40, paddingHorizontal: 16, justifyContent: 'center' },
  primaryButton: { height: 40, paddingHorizontal: 18, borderRadius: 10, justifyContent: 'center' },

  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  notesTitle: { fontSize: 18, fontWeight: '700' },
  orderToggle: { flexDirection: 'row', borderRadius: 8, padding: 3 },
  orderOption: { paddingHorizontal: 10, height: 30, borderRadius: 6, justifyContent: 'center' },
  orderText: { fontSize: 13, fontWeight: '600' },
  emptyNotes: { fontSize: 14, lineHeight: 20, paddingVertical: 8 },
  noteSeparator: { height: 10 },
  noteCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  noteTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noteTagText: { fontSize: 12, fontWeight: '600' },
  noteFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteTime: { fontSize: 12 },

  noteCardEditing: { borderWidth: 2 },
  composer: {
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  editingBanner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editingText: { flex: 1, fontSize: 13, fontWeight: '600' },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 132,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
