import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TASK_CATEGORIES, type TaskCategory } from '../../../types/task';
import { useColors } from '../../../theme/colors';
import { CATEGORY_ICONS, useTaskLabels } from '../taskMeta';

interface CategoryPickerProps {
  value: TaskCategory;
  onChange: (category: TaskCategory) => void;
  accessibilityLabel?: string;
}

/** Icon chips for Home / Work / Personal / None. */
export function CategoryPicker({
  value,
  onChange,
  accessibilityLabel = 'Category',
}: CategoryPickerProps) {
  const colors = useColors();
  const labels = useTaskLabels();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.chips}>
      {TASK_CATEGORIES.map((category) => {
        const selected = category === value;
        const label = labels.category(category);
        const icon = CATEGORY_ICONS[category];
        const tint = selected ? colors.accentText : colors.textMuted;
        return (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            accessibilityRole="radio"
            accessibilityLabel={label}
            aria-checked={selected}
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
  );
}

const styles = StyleSheet.create({
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
  pressed: {
    opacity: 0.6,
  },
});
