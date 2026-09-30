import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../../theme/colors';

export interface ChartBar {
  key: string;
  /** Short x-axis label ("Tue", "29"). Shown selectively. */
  axisLabel: string;
  /** Full description used in the caption and for screen readers. */
  description: string;
  planned: number;
  onTime: number;
  rate: number | null;
  /** Today's column: still in progress, drawn lighter. */
  inProgress?: boolean;
}

interface TrendChartProps {
  bars: ChartBar[];
  /** Caption when nothing is selected, e.g. the period total. */
  summary: string;
  colors: Colors;
  /** Label every bar (7 or fewer bars, or the weekday view). */
  labelAll?: boolean;
}

const PLOT_HEIGHT = 132;
const Y_TICKS = [1, 0.5, 0];

/**
 * Flexbox column chart of on-time rates (no chart library).
 *
 * Each column is a meter: the light track means "something was planned",
 * the accent fill is the share done on time. A day with nothing planned has
 * no track at all, so "0%" and "nothing planned" never look the same.
 * One axis (0-100%), hairline grid, bars <= 24px with a 4px rounded top and a
 * square base. Tapping a column shows its numbers in the caption (the mobile
 * tooltip); every column also carries a full accessibility label.
 */
export function TrendChart({ bars, summary, colors, labelAll }: TrendChartProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedBar = bars.find((bar) => bar.key === selected);

  // Label every bar when few; otherwise about six labels, anchored on the latest.
  const step = labelAll || bars.length <= 7 ? 1 : Math.ceil(bars.length / 6);
  const showLabel = (index: number) => (bars.length - 1 - index) % step === 0;

  return (
    <View style={styles.container}>
      <Text
        style={[styles.caption, { color: selectedBar ? colors.text : colors.textMuted }]}
        accessibilityLiveRegion="polite"
      >
        {selectedBar ? selectedBar.description : summary}
      </Text>

      <View style={styles.chartRow}>
        {/* Y axis */}
        <View style={styles.yAxis}>
          {Y_TICKS.map((tick) => (
            <Text
              key={tick}
              style={[
                styles.yLabel,
                { color: colors.textMuted, top: (1 - tick) * PLOT_HEIGHT - 7 },
              ]}
            >
              {`${tick * 100}%`}
            </Text>
          ))}
        </View>

        <View style={styles.plot}>
          {/* Hairline gridlines, recessive */}
          {Y_TICKS.map((tick) => (
            <View
              key={tick}
              style={[
                styles.gridline,
                { top: (1 - tick) * PLOT_HEIGHT, backgroundColor: colors.border },
              ]}
            />
          ))}

          <View style={styles.columns}>
            {bars.map((bar) => {
              const isSelected = bar.key === selected;
              return (
                <Pressable
                  key={bar.key}
                  onPress={() => setSelected(isSelected ? null : bar.key)}
                  accessibilityRole="button"
                  accessibilityLabel={bar.description}
                  aria-selected={isSelected}
                  style={styles.column}
                >
                  {bar.planned > 0 ? (
                    <View
                      style={[
                        styles.track,
                        { backgroundColor: colors.accentSoft },
                        isSelected && { borderColor: colors.accentText, borderWidth: 1.5 },
                      ]}
                    >
                      <View
                        style={[
                          styles.fill,
                          {
                            height: `${(bar.rate ?? 0) * 100}%`,
                            backgroundColor: colors.accent,
                            opacity: bar.inProgress ? 0.5 : 1,
                          },
                        ]}
                      />
                    </View>
                  ) : (
                    <View style={[styles.emptyMark, { backgroundColor: colors.border }]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* X axis labels, selective. Each sits in a box wider than its column,
          centred on it, so "28" isn't truncated when columns are narrow. */}
      <View style={styles.xAxis} importantForAccessibility="no-hide-descendants">
        {bars.map((bar, index) => (
          <View key={bar.key} style={styles.xSlot}>
            {showLabel(index) && (
              <Text
                style={[
                  styles.xLabel,
                  { color: bar.key === selected ? colors.text : colors.textMuted },
                  bar.inProgress && styles.xLabelToday,
                ]}
              >
                {bar.axisLabel}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const Y_AXIS_WIDTH = 36;

const styles = StyleSheet.create({
  container: { gap: 8 },
  caption: { fontSize: 14, lineHeight: 20, minHeight: 40 },
  chartRow: { flexDirection: 'row', height: PLOT_HEIGHT },
  yAxis: { width: Y_AXIS_WIDTH },
  yLabel: { position: 'absolute', end: 6, fontSize: 11, fontVariant: ['tabular-nums'] },
  plot: { flex: 1 },
  gridline: { position: 'absolute', start: 0, end: 0, height: StyleSheet.hairlineWidth },
  columns: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  track: {
    width: '64%',
    maxWidth: 24,
    height: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  emptyMark: { width: 4, height: 4, borderRadius: 2, marginBottom: -2 },
  xAxis: { flexDirection: 'row', marginStart: Y_AXIS_WIDTH },
  xSlot: { flex: 1, alignItems: 'center' },
  // Short labels only ("Tue", "28", "27.9"); a fixed box wider than narrow columns.
  xLabel: { width: 44, flexShrink: 0, textAlign: 'center', fontSize: 11 },
  xLabelToday: { fontWeight: '700' },
});
