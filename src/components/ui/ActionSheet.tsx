import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/colors';

export interface SheetAction {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Red styling for irreversible actions. Choosing it is the confirmation. */
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  message?: string;
  actions: SheetAction[];
  cancelLabel: string;
  onClose: () => void;
}

const DESTRUCTIVE = '#dc2626';

/**
 * Bottom sheet menu, used for long-press menus. Built in-app rather than with
 * Alert/ActionSheetIOS so it looks the same on iOS and Android, follows the
 * theme, and works on web (where react-native-web's Alert is a no-op).
 */
export function ActionSheet({ visible, title, message, actions, cancelLabel, onClose }: ActionSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
      />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 12) },
        ]}
        accessibilityViewIsModal
      >
        {(title || message) && (
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            {title && (
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {title}
              </Text>
            )}
            {message && <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>}
          </View>
        )}

        {actions.map((action) => {
          const tint = action.destructive ? DESTRUCTIVE : colors.text;
          return (
            <Pressable
              key={action.label}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.field }]}
            >
              {action.icon && <Ionicons name={action.icon} size={20} color={tint} />}
              <Text style={[styles.actionText, { color: tint }]}>{action.label}</Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.cancel,
            { backgroundColor: pressed ? colors.border : colors.field },
          ]}
        >
          <Text style={[styles.cancelText, { color: colors.text }]}>{cancelLabel}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionText: { fontSize: 16, fontWeight: '500' },
  cancel: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600' },
});
