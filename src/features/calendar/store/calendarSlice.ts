import { create, type StateCreator } from 'zustand';
import type { TimelineView } from '../timeline';

export interface CalendarSlice {
  /** Which date window the task views show. Resolve with `getViewRange`. */
  activeView: TimelineView;
  setActiveView: (view: TimelineView) => void;
}

export const createCalendarSlice: StateCreator<CalendarSlice> = (set) => ({
  activeView: 'today',
  setActiveView: (activeView) => set({ activeView }),
});

// Deliberately not persisted: the app should always open on "Today".
export const useCalendarStore = create<CalendarSlice>()(createCalendarSlice);
