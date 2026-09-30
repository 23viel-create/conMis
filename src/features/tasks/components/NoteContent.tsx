import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Colors } from '../../../theme/colors';
import { parseInline, parseNote } from '../notes/noteMarkdown';

interface NoteContentProps {
  content: string;
  colors: Colors;
  /** Called with the source line index when a checklist box is tapped. */
  onToggleItem?: (lineIndex: number) => void;
}

/** Renders the light-markdown subset from noteMarkdown.ts. */
export function NoteContent({ content, colors, onToggleItem }: NoteContentProps) {
  const lines = parseNote(content);

  return (
    <View style={styles.container}>
      {lines.map((line) => {
        switch (line.kind) {
          case 'checklist':
            return (
              <Pressable
                key={line.index}
                onPress={onToggleItem ? () => onToggleItem(line.index) : undefined}
                disabled={!onToggleItem}
                accessibilityRole="checkbox"
                aria-checked={line.checked}
                accessibilityLabel={line.text}
                hitSlop={6}
                style={styles.row}
              >
                <Ionicons
                  name={line.checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={line.checked ? colors.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.text,
                    styles.flex,
                    { color: line.checked ? colors.textMuted : colors.text },
                    line.checked && styles.checkedText,
                  ]}
                >
                  <Inline text={line.text} />
                </Text>
              </Pressable>
            );
          case 'bullet':
            return (
              <View key={line.index} style={styles.row}>
                <Text style={[styles.text, { color: colors.textMuted }]}>•</Text>
                <Text style={[styles.text, styles.flex, { color: colors.text }]}>
                  <Inline text={line.text} />
                </Text>
              </View>
            );
          case 'heading':
            return (
              <Text key={line.index} style={[styles.heading, { color: colors.text }]}>
                <Inline text={line.text} />
              </Text>
            );
          case 'text':
            // Keep blank lines as spacing, like paragraphs.
            return line.text.trim() === '' ? (
              <View key={line.index} style={styles.blank} />
            ) : (
              <Text key={line.index} style={[styles.text, { color: colors.text }]}>
                <Inline text={line.text} />
              </Text>
            );
        }
      })}
    </View>
  );
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((span, i) =>
        span.bold ? (
          <Text key={i} style={styles.bold}>
            {span.text}
          </Text>
        ) : (
          span.text
        ),
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  flex: { flex: 1 },
  text: { fontSize: 15, lineHeight: 21, textAlign: 'auto' },
  heading: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  checkedText: { textDecorationLine: 'line-through' },
  bold: { fontWeight: '700' },
  blank: { height: 6 },
});
