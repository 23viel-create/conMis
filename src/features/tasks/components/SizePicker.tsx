import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TASK_SIZES, type TaskSize } from '../../../types/task';
import { useColors } from '../../../theme/colors';
import { SIZE_LABELS } from '../taskMeta';

interface SizePickerProps {
  value: TaskSize;
  onChange: (size: TaskSize) => void;
  accessibilityLabel?: string;
}

/** S / M / L segmented control. */
export function SizePicker({ value, onChange, accessibilityLabel = 'Size' }: SizePickerProps) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.segmented, { backgroundColor: colors.field }]}
    >
      {TASK_SIZES.map((size) => {
        const selected = size === value;
        return (
          <Pressable
            key={size}
            onPress={() => onChange(size)}
            accessibilityRole="radio"
            accessibilityLabel={SIZE_LABELS[size].full}
            aria-checked={selected}
            hitSlop={4}
            style={({ pressed }) => [
              styles.segment,
              selected && [styles.segmentSelected, { backgroundColor: colors.segmentActive }],
              pressed && !selected && styles.pressed,
            ]}
          >
            <Text
              style={[styles.segmentText, { color: selected ? colors.accentText : colors.textMuted }]}
            >
              {SIZE_LABELS[size].short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
  pressed: {
    opacity: 0.6,
  },
});
