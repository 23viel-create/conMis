import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  I18nManager,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../theme/colors';
import { useCalendarStore } from '../store/calendarSlice';
import { TIMELINE_VIEWS, getViewRange, type DateRange, type TimelineView } from '../timeline';

const TRACK_PADDING = 4;

interface TimelineNavProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Segmented control for the active date view, with an indicator that slides
 * between segments. Mirrors automatically in RTL (Hebrew).
 */
export function TimelineNav({ style }: TimelineNavProps) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const activeView = useCalendarStore((state) => state.activeView);
  const setActiveView = useCalendarStore((state) => state.setActiveView);

  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const hasPositioned = useRef(false);

  const activeIndex = TIMELINE_VIEWS.indexOf(activeView);
  const segmentWidth =
    trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / TIMELINE_VIEWS.length : 0;
  // Transforms are not mirrored in RTL, so flip the direction ourselves.
  const offset = activeIndex * segmentWidth * (I18nManager.isRTL ? -1 : 1);

  useEffect(() => {
    if (segmentWidth === 0) return;
    if (!hasPositioned.current) {
      // First layout: place the indicator without animating in from the edge.
      translateX.setValue(offset);
      hasPositioned.current = true;
      return;
    }
    Animated.spring(translateX, {
      toValue: offset,
      useNativeDriver: Platform.OS !== 'web',
      speed: 20,
      bounciness: 4,
    }).start();
  }, [offset, segmentWidth, translateX]);

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={style}>
      <View
        onLayout={handleLayout}
        accessibilityRole="tablist"
        accessibilityLabel={t('timeline.label')}
        style={[styles.track, { backgroundColor: colors.field }]}
      >
        {segmentWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: segmentWidth,
                backgroundColor: colors.segmentActive,
                transform: [{ translateX }],
              },
            ]}
          />
        )}

        {TIMELINE_VIEWS.map((view) => {
          const selected = view === activeView;
          return (
            <Pressable
              key={view}
              onPress={() => setActiveView(view)}
              accessibilityRole="tab"
              aria-selected={selected}
              style={({ pressed }) => [styles.segment, pressed && !selected && styles.pressed]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.label,
                  selected && styles.labelSelected,
                  { color: selected ? colors.accentText : colors.textMuted },
                ]}
              >
                {t(`timeline.${view}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.caption, { color: colors.textMuted }]}>
        {formatRange(activeView, getViewRange(activeView), i18n.language)}
      </Text>
    </View>
  );
}

function formatRange(view: TimelineView, range: DateRange, locale: string): string {
  if (view === 'week') {
    const short = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    const lastDay = range.end - 1;
    return `${short.format(range.start)} – ${short.format(lastDay)}`;
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(range.start);
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: TRACK_PADDING,
  },
  indicator: {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    start: TRACK_PADDING,
    borderRadius: 9,
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    // No `elevation`: on Android it also raises z-order above the labels.
  },
  segment: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelSelected: {
    fontWeight: '700',
  },
  caption: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
