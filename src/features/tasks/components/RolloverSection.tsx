import { useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatDay } from '../../../lib/dateFormat';
import type { Task } from '../../../types/task';
import { useColors, type Colors } from '../../../theme/colors';
import { useTodayKey } from '../../calendar';
import { useRolloverTasks } from '../hooks/useRolloverTasks';
import { useTasksStore } from '../store/tasksSlice';
import { CATEGORY_ICONS } from '../taskMeta';

/**
 * The rollover inbox: open tasks from earlier days, shown at the top of
 * Today. Each can be moved to today in one tap, opened to pick another date,
 * or simply left here (the section can be collapsed). Moving a task later
 * goes through updateTask, so it gets the usual reschedule note.
 */
export function RolloverSection({ style }: { style?: StyleProp<ViewStyle> }) {
  const tasks = useRolloverTasks();
  const updateTask = useTasksStore((state) => state.updateTask);
  const today = useTodayKey();
  const colors = useColors();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  if (tasks.length === 0) return null;

  function moveToToday(ids: string[]) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    for (const id of ids) updateTask(id, { scheduledFor: today });
  }

  function toggleExpanded() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((value) => !value);
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.warningSoft, borderColor: colors.warningBorder },
        style,
      ]}
    >
      <Pressable
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={expanded ? t('rollover.collapse') : t('rollover.expand')}
        aria-expanded={expanded}
        style={styles.header}
      >
        <Ionicons name="hourglass-outline" size={18} color={colors.warningText} />
        <Text style={[styles.title, { color: colors.warningText }]} accessibilityRole="header">
          {t('rollover.title')}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.warningBorder }]}>
          <Text style={[styles.badgeText, { color: colors.warningText }]}>{tasks.length}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.warningText}
        />
      </Pressable>

      {expanded && (
        <>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t('rollover.hint')}</Text>
          <View style={styles.list}>
            {tasks.map((task) => (
              <RolloverRow
                key={task.id}
                task={task}
                colors={colors}
                onMoveToToday={() => moveToToday([task.id])}
              />
            ))}
          </View>
          {tasks.length > 1 && (
            <Pressable
              onPress={() => moveToToday(tasks.map((task) => task.id))}
              accessibilityRole="button"
              style={({ pressed }) => [styles.moveAll, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-down-circle-outline" size={18} color={colors.accentText} />
              <Text style={[styles.moveAllText, { color: colors.accentText }]}>
                {t('rollover.moveAll')}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

function RolloverRow({
  task,
  colors,
  onMoveToToday,
}: {
  task: Task;
  colors: Colors;
  onMoveToToday: () => void;
}) {
  const { t, i18n } = useTranslation();
  // selectRolloverTasks only returns scheduled tasks.
  const planned = formatDay(task.scheduledFor as string, i18n.language);

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.rowBody, pressed && styles.pressed]}
      >
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.rowMeta}>
          <Ionicons name={CATEGORY_ICONS[task.category]} size={13} color={colors.textMuted} />
          <Text style={[styles.rowMetaText, { color: colors.textMuted }]}>
            {t('rollover.plannedFor', { date: planned })}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onMoveToToday}
        accessibilityRole="button"
        accessibilityLabel={t('rollover.moveToTodayLabel', { title: task.title })}
        hitSlop={6}
        style={({ pressed }) => [
          styles.moveButton,
          { backgroundColor: colors.accentSoft, borderColor: colors.accent },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="arrow-down" size={14} color={colors.accentText} />
        <Text style={[styles.moveButtonText, { color: colors.accentText }]}>
          {t('rollover.moveToToday')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  badge: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 18 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: '500' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowMetaText: { fontSize: 12 },
  moveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
  },
  moveButtonText: { fontSize: 13, fontWeight: '600' },
  moveAll: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 4,
  },
  moveAllText: { fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
