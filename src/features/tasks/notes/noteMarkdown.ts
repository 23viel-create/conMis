/**
 * A deliberately small, line-based markdown subset for notes. A full
 * markdown renderer is heavy on mobile; these cover planning use cases.
 *
 *   - [ ] todo / - [x] done   (also "[ ] todo", "* [ ] todo")
 *   - bullet                  (also "* bullet")
 *   # Heading
 *   **bold** inline
 */

export type NoteLine =
  | { kind: 'checklist'; checked: boolean; text: string; index: number }
  | { kind: 'bullet'; text: string; index: number }
  | { kind: 'heading'; text: string; index: number }
  | { kind: 'text'; text: string; index: number };

const CHECKLIST = /^\s*(?:[-*]\s+)?\[([ xX])\]\s?(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const HEADING = /^\s*#{1,3}\s+(.*)$/;

/** `index` is the source line number, used to toggle checklist items. */
export function parseNote(content: string): NoteLine[] {
  return content.split('\n').map((line, index): NoteLine => {
    let match = CHECKLIST.exec(line);
    if (match) return { kind: 'checklist', checked: match[1] !== ' ', text: match[2], index };
    match = BULLET.exec(line);
    if (match) return { kind: 'bullet', text: match[1], index };
    match = HEADING.exec(line);
    if (match) return { kind: 'heading', text: match[1], index };
    return { kind: 'text', text: line, index };
  });
}

/** Flips the checkbox on one line, leaving every other character untouched. */
export function toggleChecklistLine(content: string, lineIndex: number): string {
  const lines = content.split('\n');
  const line = lines[lineIndex];
  if (line === undefined || !CHECKLIST.test(line)) return content;
  lines[lineIndex] = line.replace(/\[([ xX])\]/, (_, mark: string) => (mark === ' ' ? '[x]' : '[ ]'));
  return lines.join('\n');
}

export interface InlineSpan {
  text: string;
  bold: boolean;
}

/** Splits "**bold** and plain" into styled spans. Unclosed ** stays literal. */
export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    if (match.index > last) spans.push({ text: text.slice(last, match.index), bold: false });
    spans.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), bold: false });
  return spans;
}

/** One-line plain-text summary for list previews (markers stripped). */
export function notePreviewText(content: string): string {
  return parseNote(content)
    .map((line) => {
      const text = line.text.replace(/\*\*(.+?)\*\*/g, '$1').trim();
      if (!text) return '';
      return line.kind === 'checklist' ? `${line.checked ? '☑' : '☐'} ${text}` : text;
    })
    .filter(Boolean)
    .join(' · ');
}
