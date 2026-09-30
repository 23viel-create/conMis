import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { dayKeyToDate } from '../../../lib/dayKey';
import { TASK_CATEGORIES, TASK_SIZES, type DayKey } from '../../../types/task';
import { useColors, type Colors } from '../../../theme/colors';
import { useTodayKey } from '../../calendar';
import { useTasksStore } from '../../tasks/store/tasksSlice';
import { CATEGORY_ICONS, useTaskLabels } from '../../tasks/taskMeta';
import { findHolidays } from '../holidays';
import { REFLECTION_PERIODS, getPeriodRange, type ReflectionPeriod } from '../periods';
import { summarizeReflection, type RateStat } from '../selectors';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * The reflection dashboard: execution vs. intention for a chosen period.
 *
 * Visual rules (from the dataviz guidance): one hero number, stat tiles for
 * single values, one accent hue for every bar (the groups are labelled, so
 * hue carries no identity), values at the bar tips, and text always in text
 * colors, never the accent. Every value is also written out, so nothing
 * depends on reading a bar length.
 */
export function ReflectionDashboard() {
  const tasks = useTasksStore((state) => state.tasks);
  const today = useTodayKey();
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const labels = useTaskLabels();
  const [period, setPeriod] = useState<ReflectionPeriod>('week');

  const range = useMemo(() => getPeriodRange(period, today, tasks), [period, today, tasks]);
  const summary = useMemo(() => summarizeReflection(tasks, range, today), [tasks, range, today]);
  const holidays = useMemo(() => findHolidays(range), [range]);

  const percent = useMemo(
    () => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 0 }),
    [i18n.language],
  );
  const shortDate = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }),
    [i18n.language],
  );
  const formatSpan = (first: DayKey, last: DayKey) =>
    first === last
      ? shortDate.format(dayKeyToDate(first))
      : `${shortDate.format(dayKeyToDate(first))} – ${shortDate.format(dayKeyToDate(last))}`;

  const lastDay = today; // ranges always end with today
  const { execution, postponements } = summary;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {t('reflection.title')}
        </Text>

        {/* One filter row scopes everything below it. */}
        <PeriodPicker value={period} onChange={setPeriod} colors={colors} />
        <Text style={[styles.rangeCaption, { color: colors.textMuted }]}>
          {formatSpan(range.start, lastDay)}
        </Text>

        {/* Hero: execution ratio */}
        <Card colors={colors}>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>
            {t('reflection.executionTitle')}
          </Text>
          {execution.rate === null ? (
            <Text style={[styles.body, { color: colors.textMuted }]}>
              {t('reflection.noPlanned')}
            </Text>
          ) : (
            <>
              <Text style={[styles.hero, { color: colors.text }]}>
                {percent.format(execution.rate)}
              </Text>
              <Meter
                rate={execution.rate}
                colors={colors}
                height={12}
                accessibilityLabel={t('reflection.executionTitle')}
              />
              <Text style={[styles.body, { color: colors.text }]}>
                {t('reflection.executionDetail', {
                  completed: execution.completed,
                  planned: execution.planned,
                })}
              </Text>
              <View style={styles.details}>
                <Detail icon="checkmark-done-outline" colors={colors}>
                  {t('reflection.onPlannedDay', { n: summary.completedOnPlannedDay })}
                </Detail>
                {summary.openToday > 0 && (
                  <Detail icon="time-outline" colors={colors}>
                    {t('reflection.openToday', { n: summary.openToday })}
                  </Detail>
                )}
              </View>
            </>
          )}
        </Card>

        {/* KPI row */}
        <View style={styles.tiles}>
          <StatTile
            label={t('reflection.postponementsLabel')}
            value={String(postponements.events)}
            detail={
              postponements.events > 0
                ? t('reflection.postponementsDetail', { n: postponements.tasks })
                : undefined
            }
            colors={colors}
          />
          <StatTile
            label={t('reflection.unscheduledLabel')}
            value={String(summary.completedUnscheduled)}
            detail={t('reflection.unscheduledDetail')}
            colors={colors}
          />
        </View>

        {/* Postponement insight */}
        <Card colors={colors} style={styles.insight}>
          <Ionicons
            name={postponements.events > 0 ? 'hourglass-outline' : 'sparkles-outline'}
            size={20}
            color={colors.textMuted}
          />
          <Text style={[styles.body, styles.flex, { color: colors.text }]}>
            {postponements.events > 0
              ? t('reflection.insightPostponed', { events: postponements.events })
              : t('reflection.insightNoPostponed')}
          </Text>
        </Card>

        {/* Breakdowns */}
        <Card colors={colors}>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]} accessibilityRole="header">
            {t('reflection.bySize')}
          </Text>
          {TASK_SIZES.map((size) => (
            <BreakdownRow
              key={size}
              label={labels.size(size).full}
              badge={labels.size(size).short}
              stat={summary.bySize[size]}
              percent={percent}
              colors={colors}
            />
          ))}
        </Card>

        <Card colors={colors}>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]} accessibilityRole="header">
            {t('reflection.byCategory')}
          </Text>
          {TASK_CATEGORIES.filter(
            // "None" only appears when it was actually used.
            (category) => category !== 'uncategorized' || summary.byCategory[category].planned > 0,
          ).map((category) => (
            <BreakdownRow
              key={category}
              label={labels.category(category)}
              icon={CATEGORY_ICONS[category]}
              stat={summary.byCategory[category]}
              percent={percent}
              colors={colors}
            />
          ))}
        </Card>

        {/* Holidays */}
        {holidays.length > 0 && (
          <Card colors={colors}>
            <View style={styles.holidayHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.cardLabel, styles.flex, { color: colors.textMuted }]}>
                {t('reflection.holidaysTitle')}
              </Text>
            </View>
            {holidays.map((holiday) => (
              <Text
                key={`${holiday.id}-${holiday.first}`}
                style={[styles.body, { color: colors.text }]}
              >
                {t(`holidays.${holiday.id}`)}
                <Text
                  style={{ color: colors.textMuted }}
                >{`  ${formatSpan(holiday.first, holiday.last)}`}</Text>
              </Text>
            ))}
            <Text style={[styles.small, { color: colors.textMuted }]}>
              {t('reflection.holidaysHint')}
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------------------------------------------- Pieces */

function PeriodPicker({
  value,
  onChange,
  colors,
}: {
  value: ReflectionPeriod;
  onChange: (period: ReflectionPeriod) => void;
  colors: Colors;
}) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('reflection.periodLabel')}
      style={[styles.segmented, { backgroundColor: colors.field }]}
    >
      {REFLECTION_PERIODS.map((period) => {
        const selected = period === value;
        return (
          <Pressable
            key={period}
            onPress={() => onChange(period)}
            accessibilityRole="radio"
            aria-checked={selected}
            style={[styles.segment, selected && { backgroundColor: colors.segmentActive }]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.segmentText,
                { color: selected ? colors.accentText : colors.textMuted },
                selected && styles.segmentTextSelected,
              ]}
            >
              {t(`reflection.periods.${period}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Card({
  colors,
  style,
  children,
}: {
  colors: Colors;
  style?: object;
  children: ReactNode;
}) {
  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
    >
      {children}
    </View>
  );
}

/** Ratio against 100%: accent fill on a lighter step of the same hue. */
function Meter({
  rate,
  colors,
  height = 8,
  accessibilityLabel,
}: {
  rate: number;
  colors: Colors;
  height?: number;
  accessibilityLabel?: string;
}) {
  const clamped = Math.max(0, Math.min(1, rate));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: colors.accentSoft },
      ]}
    >
      {clamped > 0 && (
        <View
          style={[
            styles.fill,
            { width: `${clamped * 100}%`, borderRadius: 4, backgroundColor: colors.accent },
          ]}
        />
      )}
    </View>
  );
}

function StatTile({
  label,
  value,
  detail,
  colors,
}: {
  label: string;
  value: string;
  detail?: string;
  colors: Colors;
}) {
  return (
    <View
      style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessible
      accessibilityLabel={[label, value, detail].filter(Boolean).join(', ')}
    >
      <Text style={[styles.tileLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.tileValue, { color: colors.text }]}>{value}</Text>
      {detail && <Text style={[styles.small, { color: colors.textMuted }]}>{detail}</Text>}
    </View>
  );
}

function Detail({
  icon,
  colors,
  children,
}: {
  icon: IconName;
  colors: Colors;
  children: ReactNode;
}) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={[styles.small, styles.flex, { color: colors.textMuted }]}>{children}</Text>
    </View>
  );
}

function BreakdownRow({
  label,
  badge,
  icon,
  stat,
  percent,
  colors,
}: {
  label: string;
  badge?: string;
  icon?: IconName;
  stat: RateStat;
  percent: Intl.NumberFormat;
  colors: Colors;
}) {
  const { t } = useTranslation();
  const empty = stat.rate === null;
  return (
    <View
      style={[styles.row, empty && styles.rowEmpty]}
      accessible
      accessibilityLabel={
        empty
          ? t('reflection.rowEmpty', { label })
          : `${t('reflection.rowLabel', { label, completed: stat.completed, planned: stat.planned })}, ${percent.format(stat.rate as number)}`
      }
    >
      <View style={styles.rowLabel}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.field }]}>
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>{badge}</Text>
          </View>
        )}
        {icon && <Ionicons name={icon} size={16} color={colors.textMuted} />}
        <Text style={[styles.rowText, { color: colors.text }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.flex}>
        <Meter rate={stat.rate ?? 0} colors={colors} />
      </View>
      <Text style={[styles.rowValue, { color: empty ? colors.textMuted : colors.text }]}>
        {empty ? '—' : `${stat.completed}/${stat.planned} · ${percent.format(stat.rate as number)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  title: { fontSize: 28, fontWeight: '700' },
  rangeCaption: { fontSize: 13, textAlign: 'center', marginTop: -6 },

  segmented: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segmentText: { fontSize: 14, fontWeight: '500' },
  segmentTextSelected: { fontWeight: '700' },

  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 10 },
  cardLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  hero: { fontSize: 56, fontWeight: '700', lineHeight: 62 },
  body: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 18 },
  details: { gap: 4 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  track: { width: '100%', overflow: 'hidden', flexDirection: 'row' },
  fill: { height: '100%' },

  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 2 },
  tileLabel: { fontSize: 13, fontWeight: '500' },
  tileValue: { fontSize: 30, fontWeight: '600' },

  insight: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32 },
  rowEmpty: { opacity: 0.55 },
  rowLabel: { width: 108, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText: { fontSize: 14, flexShrink: 1 },
  rowValue: { minWidth: 84, textAlign: 'right', fontSize: 13, fontVariant: ['tabular-nums'] },
  badge: {
    minWidth: 22,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  holidayHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
