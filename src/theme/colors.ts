import { useColorScheme } from 'react-native';

// Mirrors the Tailwind slate/indigo palette from the web draft.
export const palette = {
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    field: '#f1f5f9',
    fieldFocused: '#ffffff',
    text: '#0f172a',
    textMuted: '#475569',
    placeholder: '#94a3b8',
    accent: '#4f46e5',
    accentText: '#4338ca',
    accentSoft: '#eef2ff',
    segmentActive: '#ffffff',
    onAccent: '#ffffff',
  },
  dark: {
    background: '#020617',
    card: '#0f172a',
    border: '#334155',
    field: '#1e293b',
    fieldFocused: '#0f172a',
    text: '#f1f5f9',
    textMuted: '#cbd5e1',
    placeholder: '#64748b',
    accent: '#6366f1',
    accentText: '#c7d2fe',
    accentSoft: 'rgba(99, 102, 241, 0.15)',
    segmentActive: '#334155',
    onAccent: '#ffffff',
  },
};

export type Colors = (typeof palette)['light'];

export function useColors(): Colors {
  return palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
