import type { TranslationResources } from './he';

const en: TranslationResources = {
  notes: {
    title: 'Notes',
    empty: 'No notes yet. Write plans, [ ] checklists or thoughts below.',
    placeholder: 'Add a note…  (- [ ] makes a checklist)',
    add: 'Add note',
    pin: 'Pin note',
    unpin: 'Unpin note',
    pinned: 'Pinned',
    newest: 'Newest',
    oldest: 'Oldest',
    sortLabel: 'Note order',
    rescheduledTag: 'Rescheduled',
    rescheduled: 'Rescheduled from {{from}}',
    rescheduledWithReason: 'Rescheduled from {{from}} — Reason: {{reason}}',
  },
  taskDetail: {
    back: 'Back',
    heading: 'Task',
    titleLabel: 'Task title',
    size: 'Size',
    category: 'Category',
    date: 'Date',
    unscheduled: 'Unscheduled (shown on Today)',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    today: 'Today',
    tomorrow: 'Tomorrow',
    nextWeek: 'Next week',
    reasonLabel: 'Why postpone? (optional)',
    reasonPlaceholder: 'e.g. waiting for a reply',
    confirmReschedule: 'Reschedule',
    confirmMove: 'Move',
    cancel: 'Cancel',
    notFound: 'This task no longer exists.',
  },
  tasks: {
    empty: {
      yesterday: 'Nothing was planned for yesterday.',
      today: 'Nothing planned for today. Add a task above.',
      tomorrow: 'Nothing planned for tomorrow yet.',
      week: 'Nothing planned this week.',
    },
  },
  timeline: {
    label: 'Date range',
    yesterday: 'Yesterday',
    today: 'Today',
    tomorrow: 'Tomorrow',
    week: 'This Week',
  },
};

export default en;
