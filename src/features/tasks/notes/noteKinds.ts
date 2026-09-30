import { useMemo, type ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NoteKind } from '../../../types/task';
import type { Colors } from '../../../theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const NOTE_KIND_ICONS: Record<NoteKind, IconName> = {
  comment: 'chatbubble-outline',
  detail: 'list-outline',
  attention: 'alert-circle-outline',
  thought: 'bulb-outline',
  reschedule: 'time-outline',
};

/**
 * Color cue per kind (start border + icon). Always paired with the icon and
 * a text label, so kind is never conveyed by color alone.
 */
export function noteKindColor(kind: NoteKind, colors: Colors): string {
  switch (kind) {
    case 'detail':
      return colors.noteDetail;
    case 'attention':
      return colors.noteAttention;
    case 'thought':
      return colors.noteThought;
    case 'comment':
    case 'reschedule':
      return colors.noteNeutral;
  }
}

export function useNoteKindLabel() {
  const { t } = useTranslation();
  return useMemo(() => (kind: NoteKind) => t(`noteKinds.${kind}`), [t]);
}
